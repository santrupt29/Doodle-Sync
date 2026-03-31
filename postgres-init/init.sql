CREATE USER admin_user WITH PASSWORD 'password';

CREATE DATABASE scribble OWNER admin_user;
CREATE DATABASE scribble_words OWNER admin_user;
CREATE DATABASE scribble_users OWNER admin_user;

\c scribble
GRANT ALL ON SCHEMA public TO admin_user;

\c scribble_words
GRANT ALL ON SCHEMA public TO admin_user;

\c scribble_users
GRANT ALL ON SCHEMA public TO admin_user;