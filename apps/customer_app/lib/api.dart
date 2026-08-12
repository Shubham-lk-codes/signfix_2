import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiException implements Exception { final String message; ApiException(this.message); @override String toString()=>message; }
class SignFixApi {
  SignFixApi({String? baseUrl}):baseUrl=baseUrl??const String.fromEnvironment('API_URL',defaultValue:'http://10.0.2.2:4000/api');
  final String baseUrl; String? token;
  Future<void> restore() async => token=(await SharedPreferences.getInstance()).getString('token');
  Future<Map<String,dynamic>> login(String email,String password) async { final data=await _send('POST','/auth/login',body:{'email':email,'password':password}); token=data['token']; (await SharedPreferences.getInstance()).setString('token',token!); return data; }
  Future<void> logout() async { token=null; await (await SharedPreferences.getInstance()).remove('token'); }
  Future<List<dynamic>> products()=>_send('GET','/products').then((v)=>v['data']);
  Future<Map<String,dynamic>> calculate(Map<String,dynamic> body)=>_send('POST','/calculator',body:body);
  Future<Map<String,dynamic>> createOrder(Map<String,dynamic> body)=>_send('POST','/orders',body:body);
  Future<List<dynamic>> orders()=>_send('GET','/orders').then((v)=>v['data']);
  Future<Map<String,dynamic>> createService(Map<String,dynamic> body)=>_send('POST','/services',body:body);
  Future<List<dynamic>> services()=>_send('GET','/services').then((v)=>v['data']);
  Future<Map<String,dynamic>> chat(String message)=>_send('POST','/ai/chat',body:{'message':message});
  Future<Map<String,dynamic>> upload(File file,String kind) async { final req=http.MultipartRequest('POST',Uri.parse('$baseUrl/uploads')); if(token!=null)req.headers['Authorization']='Bearer $token'; req.fields['kind']=kind; req.files.add(await http.MultipartFile.fromPath('file',file.path)); final response=await http.Response.fromStream(await req.send()); return _decode(response); }
  Future<Map<String,dynamic>> _send(String method,String path,{Map<String,dynamic>? body}) async { final uri=Uri.parse('$baseUrl$path'); final headers={'Content-Type':'application/json',if(token!=null)'Authorization':'Bearer $token'}; late http.Response r; try { r=method=='GET'?await http.get(uri,headers:headers):await http.post(uri,headers:headers,body:jsonEncode(body)); } on SocketException { throw ApiException('Cannot connect to SignFix. Check your network.'); } return _decode(r); }
  Map<String,dynamic> _decode(http.Response r){ final data=jsonDecode(r.body) as Map<String,dynamic>; if(r.statusCode<200||r.statusCode>=300)throw ApiException(data['error']??'Request failed'); return data; }
}
