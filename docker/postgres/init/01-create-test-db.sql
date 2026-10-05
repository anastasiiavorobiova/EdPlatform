-- Runs once, when the dev Postgres volume is initialised (docker-entrypoint-initdb.d).
-- e2e tests use this separate database so they never touch dev data.
CREATE DATABASE edplatform_test;
