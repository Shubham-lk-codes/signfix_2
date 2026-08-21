const database = require('../../database');

function pool() { return database.getPool(); }
function technicianScope(user, alias = 'j') {
  return user.role === 'technician'
    ? { clause: ` AND ${alias}.technician_id=(SELECT id FROM technicians WHERE user_id=$2)`, params: [user.id] }
    : { clause: '', params: [] };
}

async function getProfile(userId) {
  const { rows } = await pool().query(`SELECT u.id,u.name,u.email,u.mobile,u.status,u.created_at AS "createdAt",
    t.id AS "technicianId",t.service_areas AS "serviceAreas",t.location_sharing AS "locationSharing",
    t.profile_photo_url AS "profilePhotoUrl",t.emergency_contact AS "emergencyContact",t.skills
    FROM users u JOIN technicians t ON t.user_id=u.id WHERE u.id=$1`, [userId]);
  return rows[0];
}

async function updateProfile(userId, data) {
  const client = await pool().connect();
  try {
    await client.query('BEGIN');
    await client.query(`UPDATE users SET name=COALESCE($2,name),mobile=COALESCE($3,mobile),updated_at=NOW() WHERE id=$1`, [userId,data.name,data.mobile]);
    await client.query(`UPDATE technicians SET emergency_contact=COALESCE($2,emergency_contact),profile_photo_url=COALESCE($3,profile_photo_url),location_sharing=COALESCE($4,location_sharing),skills=COALESCE($5::jsonb,skills) WHERE user_id=$1`, [userId,data.emergencyContact,data.profilePhotoUrl,data.locationSharing,data.skills ? JSON.stringify(data.skills) : null]);
    await client.query('COMMIT');
    return getProfile(userId);
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}

function filters(query, user) {
  const values = [], where = [];
  if (user.role === 'technician') { values.push(user.id); where.push(`t.user_id=$${values.length}`); }
  if (query.status) { values.push(query.status); where.push(`j.status=$${values.length}`); }
  if (query.priority) { values.push(query.priority); where.push(`LOWER(s.priority)=LOWER($${values.length})`); }
  if (query.from) { values.push(query.from); where.push(`j.scheduled_at >= $${values.length}::date`); }
  if (query.to) { values.push(query.to); where.push(`j.scheduled_at < ($${values.length}::date + INTERVAL '1 day')`); }
  if (query.filter === 'today') where.push(`j.scheduled_at >= CURRENT_DATE AND j.scheduled_at < CURRENT_DATE + INTERVAL '1 day'`);
  if (query.filter === 'upcoming') where.push(`j.scheduled_at >= CURRENT_DATE + INTERVAL '1 day' AND j.status NOT IN ('completed','closed')`);
  if (query.filter === 'pending') where.push(`j.status IN ('assigned','accepted')`);
  if (query.filter === 'completed') where.push(`j.status IN ('completed','closed')`);
  if (query.today === 'true') where.push(`j.scheduled_at >= CURRENT_DATE AND j.scheduled_at < CURRENT_DATE + INTERVAL '1 day'`);
  if (query.emergency === 'true') where.push(`LOWER(s.priority)='emergency'`);
  return { values, sql: where.length ? `WHERE ${where.join(' AND ')}` : '' };
}

async function listJobs(user, query) {
  const f = filters(query,user), limit=Math.min(Number(query.limit)||20,100), offset=(Math.max(Number(query.page)||1,1)-1)*limit;
  f.values.push(limit,offset);
  const { rows } = await pool().query(`SELECT j.id,j.id AS "jobId",s.ticket_no AS "ticketNo",cu.name AS customer,cu.mobile AS "customerPhone",
    COALESCE(s.service_type,s.category) AS "jobType",s.category,s.service_type AS "serviceType",s.priority,j.status,j.scheduled_at AS "scheduledAt",s.location,
    CASE WHEN j.status IN ('completed','closed') THEN 100 WHEN j.status='work_in_progress' THEN 80 WHEN j.status='inspection_started' THEN 60 WHEN j.status='reached_location' THEN 45 WHEN j.status='on_the_way' THEN 30 WHEN j.status='accepted' THEN 15 ELSE 0 END AS progress,
    COUNT(*) OVER()::int AS "totalCount"
    FROM technician_jobs j JOIN service_tickets s ON s.id=j.ticket_id JOIN customers c ON c.id=s.customer_id
    JOIN users cu ON cu.id=c.user_id LEFT JOIN technicians t ON t.id=j.technician_id ${f.sql}
    ORDER BY CASE WHEN LOWER(s.priority)='emergency' THEN 0 ELSE 1 END,j.scheduled_at NULLS LAST,j.id DESC LIMIT $${f.values.length-1} OFFSET $${f.values.length}`,f.values);
  const total=rows[0]?.totalCount||0; return { items:rows.map(({totalCount,...r})=>r),pagination:{page:Math.floor(offset/limit)+1,limit,total,totalPages:Math.ceil(total/limit)} };
}

async function getJob(id,user) {
  const values=[id]; let owner=''; if(user.role==='technician'){values.push(user.id);owner=` AND t.user_id=$2`;}
  const {rows}=await pool().query(`SELECT j.*,s.ticket_no AS "ticketNo",s.category,s.description,s.location,s.photos AS "signBoardPhotos",s.priority,
    s.service_type AS "serviceType",s.admin_instructions AS "adminInstructions",s.asset_id AS "assetId",cu.name AS "customerName",cu.mobile AS "customerPhone",
    a.asset_no AS "assetNo",a.details AS "assetDetails",a.location AS "assetLocation"
    FROM technician_jobs j JOIN service_tickets s ON s.id=j.ticket_id JOIN customers c ON c.id=s.customer_id JOIN users cu ON cu.id=c.user_id
    LEFT JOIN technicians t ON t.id=j.technician_id LEFT JOIN sign_board_assets a ON a.id=s.asset_id WHERE j.id=$1${owner}`,values);
  if(!rows[0]) return null;
  const [history,photos,materials,services]=await Promise.all([
    pool().query(`SELECT status,notes,created_at AS "createdAt" FROM job_status_history WHERE job_id=$1 ORDER BY created_at`,[id]),
    pool().query(`SELECT id,photo_type AS type,storage_key AS url,mime_type AS "mimeType",created_at AS "createdAt" FROM job_photos WHERE job_id=$1 ORDER BY created_at`,[id]),
    pool().query(`SELECT id,name,quantity,unit,notes,created_at AS "createdAt" FROM job_materials WHERE job_id=$1 ORDER BY id`,[id]),
    rows[0].assetId ? pool().query(`SELECT st.ticket_no AS "ticketNo",st.category,st.description,tj.status,tj.closed_at AS "closedAt" FROM service_tickets st LEFT JOIN technician_jobs tj ON tj.ticket_id=st.id WHERE st.asset_id=$1 AND st.id<>$2 ORDER BY st.created_at DESC LIMIT 20`,[rows[0].assetId,rows[0].ticket_id]) : {rows:[]}
  ]);
  return {...rows[0],statusHistory:history.rows,evidencePhotos:photos.rows,materials:materials.rows,previousServiceHistory:services.rows};
}

async function lockOwnedJob(client,id,user) {
  const values=[id];let owner='';if(user.role==='technician'){values.push(user.id);owner=' AND t.user_id=$2';}
  const {rows}=await client.query(`SELECT j.*,t.user_id AS technician_user_id,c.user_id AS customer_user_id,s.ticket_no FROM technician_jobs j JOIN technicians t ON t.id=j.technician_id JOIN service_tickets s ON s.id=j.ticket_id JOIN customers c ON c.id=s.customer_id WHERE j.id=$1${owner} FOR UPDATE OF j`,values);
  return rows[0];
}

async function dashboardStats(user) {
  const {rows}=await pool().query(`SELECT
    COUNT(*) FILTER(WHERE j.scheduled_at>=CURRENT_DATE AND j.scheduled_at<CURRENT_DATE+INTERVAL '1 day')::int today,
    COUNT(*) FILTER(WHERE j.status='assigned')::int assigned,
    COUNT(*) FILTER(WHERE j.status IN ('assigned','accepted'))::int pending,
    COUNT(*) FILTER(WHERE j.status IN ('on_the_way','reached_location','inspection_started','work_in_progress'))::int AS "inProgress",
    COUNT(*) FILTER(WHERE j.status IN ('completed','closed'))::int completed,
    COUNT(*) FILTER(WHERE LOWER(s.priority)='emergency')::int emergency
    FROM technician_jobs j JOIN service_tickets s ON s.id=j.ticket_id JOIN technicians t ON t.id=j.technician_id WHERE t.user_id=$1`,[user.id]);
  return rows[0];
}

module.exports={pool,getProfile,updateProfile,listJobs,getJob,lockOwnedJob,dashboardStats};
