CREATE USER admin_user WITH PASSWORD 'password';
CREATE DATABASE scribble;
GRANT ALL PRIVILEGES ON DATABASE scribble TO admin_user;
ALTER DATABASE scribble OWNER TO admin_user;