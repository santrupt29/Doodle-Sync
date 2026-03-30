CREATE USER admin_user WITH PASSWORD 'password';

       CREATE DATABASE scribble_users;
GRANT ALL PRIVILEGES ON DATABASE scribble_users TO admin_user;
ALTER DATABASE scribble_users OWNER TO admin_user;

CREATE DATABASE scribble_words;
GRANT ALL PRIVILEGES ON DATABASE scribble_words TO admin_user;
ALTER DATABASE scribble_words OWNER TO admin_user;