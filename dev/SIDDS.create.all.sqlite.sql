CREATE TABLE t_identity_type
(
  identity_type_key   INTEGER PRIMARY key AUTOINCREMENT NOT NULL,
  identity_type_name  VARCHAR2(64)         NOT NULL,
  description         VARCHAR2(128),
  last_modified       DATETIME                      DEFAULT current_timestamp               NOT NULL,
  operator_modified   INTEGER
);

CREATE TABLE T_IDENTITY
(
  identity_key         INTEGER   PRIMARY key AUTOINCREMENT,
  identity_name        VARCHAR(64)             NOT NULL,
  identity_type_key    INTEGER                  NOT NULL,
  description          VARCHAR(128)                NULL,
  salt                 INTEGER                      NULL,
  enabled              CHAR(1)                  DEFAULT '1'                   NOT NULL,
  login_enabled        CHAR(1)                  DEFAULT  '1'                   NOT NULL,
  pwd                  VARCHAR(128)                NULL,
  start_date           datetime    default current_timestamp            NOT NULL,
  end_date             datetime                    DEFAULT '9999-01-01 00:00:00' NOT NULL,
  last_modified        datetime             DEFAULT current_timestamp   NOT NULL,
  operator_modified    INTEGER                      NULL,
  first_name           VARCHAR(128)                NULL,
  last_name            VARCHAR(128)                NULL,
  email                VARCHAR(64)                 NULL,
  email2               VARCHAR(64)                 NULL,
  pwd_must_be_changed  INTEGER                  DEFAULT 1                     NOT NULL,
  phone                VARCHAR(64)                 NULL,
  external_key         INTEGER                      NULL,
  external_id          VARCHAR(64)                 NULL,
  preferences          CLOB,
  FOREIGN KEY(IDENTITY_TYPE_KEY) REFERENCES T_IDENTITY_TYPE(IDENTITY_TYPE_KEY)
);

CREATE TABLE T_IDENTITY_TO_IDENTITY
(
  parent_identity_key  INTEGER                  NOT NULL,
  identity_key         INTEGER                  NOT NULL,
  last_modified        DATE                     DEFAULT current_timestamp               NOT NULL,
  operator_modified    INTEGER,
  FOREIGN KEY(PARENT_IDENTITY_KEY) REFERENCES T_IDENTITY(IDENTITY_KEY),
  FOREIGN KEY(IDENTITY_KEY) REFERENCES T_IDENTITY(IDENTITY_KEY)
);

---------------

CREATE TABLE T_RIGHT
(
  right_key          INTEGER PRIMARY key AUTOINCREMENT NOT NULL,
  right_name         VARCHAR2(64)          NOT NULL,
  description        VARCHAR2(128),
  last_modified      DATE                       DEFAULT current_timestamp               NOT NULL,
  operator_modified  INTEGER
);

CREATE TABLE T_IDENTITY_TO_RIGHT
(
  identity_key       INTEGER                    NOT NULL,
  right_key          INTEGER                    NOT NULL,
  last_modified      DATE                       DEFAULT current_timestamp               NOT NULL,
  right_value        VARCHAR2(512)         DEFAULT 'true' NOT NULL,
  right_context      VARCHAR2(128)         DEFAULT '*'                   NOT NULL,
  operator_modified  INTEGER,
  FOREIGN KEY(IDENTITY_KEY) REFERENCES T_IDENTITY(IDENTITY_KEY),
  FOREIGN KEY(RIGHT_KEY) REFERENCES T_RIGHT(RIGHT_KEY)
);

CREATE UNIQUE INDEX IF NOT EXISTS I_T_IDENTITY_NAME
ON T_IDENTITY
(IDENTITY_NAME)
;

CREATE UNIQUE INDEX IF NOT EXISTS I_T_RIGHT_NAME
ON T_RIGHT
(RIGHT_NAME)
;

CREATE UNIQUE INDEX IF NOT EXISTS I_T_IDENTITY_TO_IDENTITY
ON T_IDENTITY_TO_IDENTITY
(PARENT_IDENTITY_KEY, IDENTITY_KEY)
;

CREATE UNIQUE INDEX IF NOT EXISTS I_T_IDENTITY_TO_RIGHT
ON T_IDENTITY_TO_RIGHT
(IDENTITY_KEY, RIGHT_KEY)
;

----------------
-- CREATE TRIGGER IF NOT EXISTS TR_U_T_IDENTITY_LM
CREATE TRIGGER TR_U_T_IDENTITY_LM
AFTER UPDATE ON T_IDENTITY FOR EACH ROW
BEGIN
  update T_IDENTITY set LAST_MODIFIED  = current_timestamp where rowid=new.rowid ;
END;

------------

-- CREATE TRIGGER IF NOT EXISTS TR_U_T_IDENTITY_TO_IDENTITY_LM
CREATE TRIGGER TR_U_T_IDENTITY_TO_IDENTITY_LM
AFTER UPDATE ON T_IDENTITY_TO_IDENTITY FOR EACH ROW
BEGIN
  update T_IDENTITY_TO_IDENTITY set LAST_MODIFIED  = current_timestamp where rowid=new.rowid ;
END;

------------

-- CREATE TRIGGER IF NOT EXISTS TR_U_T_IDENTITY_TO_RIGHT_LM
CREATE TRIGGER TR_U_T_IDENTITY_TO_RIGHT_LM
AFTER UPDATE ON T_IDENTITY_TO_RIGHT FOR EACH ROW
BEGIN
  update T_IDENTITY_TO_RIGHT set LAST_MODIFIED  = current_timestamp where rowid=new.rowid ;
END;

------------

-- CREATE TRIGGER IF NOT EXISTS TR_U_T_IDENTITY_TYPE_LM
CREATE TRIGGER TR_U_T_IDENTITY_TYPE_LM
AFTER UPDATE ON T_IDENTITY_TYPE FOR EACH ROW
BEGIN
  update T_IDENTITY_TYPE set LAST_MODIFIED  = current_timestamp where rowid=new.rowid ;
END;

------------

-- CREATE TRIGGER IF NOT EXISTS TR_U_T_RIGHT_LM
CREATE TRIGGER TR_U_T_RIGHT_LM
AFTER UPDATE ON T_RIGHT FOR EACH ROW
BEGIN
  update T_RIGHT set LAST_MODIFIED  = current_timestamp where rowid=new.rowid ;
END;

CREATE view v_identity_to_identity
AS 
SELECT 
  a.identity_key 
, a.parent_identity_key 
, b.identity_name "parent_identity_name"
, b.enabled 
, b.login_enabled 
, b.end_date 
, c.identity_type_key 
, c.identity_type_name 
from t_identity_to_identity a, t_identity b, t_identity_type c 
where a.parent_identity_key=b.identity_key and b.identity_type_key=c.identity_type_key;


CREATE VIEW v_identity_to_right
AS 
SELECT 
  B.identity_key 
, B.identity_name 
, C.right_key 
, C.right_name 
, A.right_value 
, A.right_context 
, A.last_modified 
FROM t_identity_to_right A, t_identity B, t_right C 
WHERE A.identity_key = B.identity_key 
AND A.right_key = C.right_key;

CREATE VIEW v_identity
AS 
SELECT 
  a.identity_name 
, a.identity_key 
, a.first_name 
, a.last_name 
, a.email 
, a.identity_type_key 
, c.identity_type_name 
, a.description 
, b.parent_identity_key 
-- , b.PARENT_IDENTITY_NAME 
, a.enabled 
, a.start_date 
, a.end_date 
, a.last_modified 
, a.operator_modified 
, a.last_name || ', ' || a.first_name 
, a.login_enabled 
, a.phone 
, a.email2 
, a.external_key
, a.external_id
 from t_identity a, t_identity_to_identity b, t_identity_type c 
where a.identity_key=b.identity_key and a.identity_type_key=c.identity_type_key;
