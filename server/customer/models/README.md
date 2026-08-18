# Customer data model

Customer tables and constraints are defined centrally in `database/schema.sql`. Customer-specific queries live in `../repositories`; this project deliberately does not duplicate PostgreSQL entities as ORM model classes.
