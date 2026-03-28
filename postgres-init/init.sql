-- CREATE USER admin_user WITH PASSWORD 'password';
-- CREATE DATABASE scribble;
-- GRANT ALL PRIVILEGES ON DATABASE scribble TO admin_user;
-- ALTER DATABASE scribble OWNER TO admin_user;

-- Create your custom user (if you use this in your other services)
CREATE USER admin_user WITH PASSWORD 'password';

-- 1. Create and configure the User Service database
CREATE DATABASE scribble_users;
GRANT ALL PRIVILEGES ON DATABASE scribble_users TO admin_user;
ALTER DATABASE scribble_users OWNER TO admin_user;

-- 2. Create and configure the Word Service database
CREATE DATABASE scribble_words;
GRANT ALL PRIVILEGES ON DATABASE scribble_words TO admin_user;
ALTER DATABASE scribble_words OWNER TO admin_user;