CREATE TABLE T_IDENTITY_TYPE
(
  identity_type_key   INTEGER NOT NULL AUTO_INCREMENT,
  identity_type_name  VARCHAR(64)         NOT NULL,
  description         VARCHAR(128),
  last_modified       DATETIME                      NOT NULL,
  operator_modified   INTEGER,
  PRIMARY KEY ( identity_type_key )
);

  --START_DATE           datetime    default current_timestamp            NOT NULL,
CREATE TABLE T_IDENTITY
(
  identity_key         INTEGER   AUTO_INCREMENT,
  identity_name        VARCHAR(64)             NOT NULL,
  identity_type_key    INTEGER                  NOT NULL,
  description          VARCHAR(128)                NULL,
  salt                 INTEGER                      NULL,
  enabled              CHAR(1)                  DEFAULT '1'                   NOT NULL,
  login_enabled        CHAR(1)                  DEFAULT  '1'                   NOT NULL,
  pwd                  VARCHAR(128)                NULL,
  start_date           datetime NOT NULL,
  end_date             datetime NOT NULL,
  last_modified        datetime NOT NULL,
  operator_modified    INTEGER                      NULL,
  first_name           VARCHAR(128)                NULL,
  last_name            VARCHAR(128)                NULL,
  email                VARCHAR(64)                 NULL,
  email2               VARCHAR(64)                 NULL,
  pwd_must_be_changed  INTEGER                  DEFAULT 1                     NOT NULL,
  phone                VARCHAR(64)                 NULL,
  external_key         INTEGER                      NULL,
  external_id          VARCHAR(64)                 NULL,
  preferences          TEXT,
  PRIMARY KEY ( identity_key ),
  FOREIGN KEY (identity_type_key) 
        REFERENCES t_identity_type(identity_type_key)
        ON DELETE CASCADE
);

CREATE TABLE T_IDENTITY_TO_IDENTITY
(
  parent_identity_key  INTEGER                  NOT NULL,
  identity_key         INTEGER                  NOT NULL,
  last_modified        DATEtime                 NOT NULL,
  operator_modified    INTEGER,
  FOREIGN KEY(PARENT_IDENTITY_KEY) REFERENCES T_IDENTITY(IDENTITY_KEY) ON DELETE CASCADE,
  FOREIGN KEY(IDENTITY_KEY) REFERENCES T_IDENTITY(IDENTITY_KEY) ON DELETE CASCADE
);

---------------

CREATE TABLE T_RIGHT
(
  right_key          INTEGER AUTO_INCREMENT NOT NULL,
  right_name         VARCHAR(64)          NOT NULL,
  description        VARCHAR(128),
  last_modified      DATETIME                       NOT NULL,
  operator_modified  INTEGER,
  PRIMARY KEY ( RIGHT_KEY )
);

CREATE TABLE T_IDENTITY_TO_RIGHT
(
  identity_key       INTEGER                    NOT NULL,
  right_key          INTEGER                    NOT NULL,
  last_modified      datetime                       NOT NULL,
  right_value        VARCHAR(512)         DEFAULT 'true' NOT NULL,
  right_context      VARCHAR(128)         DEFAULT '*'                   NOT NULL,
  operator_modified  INTEGER,
  FOREIGN KEY(IDENTITY_KEY) REFERENCES T_IDENTITY(IDENTITY_KEY) ON DELETE CASCADE,
  FOREIGN KEY(RIGHT_KEY) REFERENCES T_RIGHT(RIGHT_KEY) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS I_T_IDENTITY_TYPE
ON T_IDENTITY_TYPE
(IDENTITY_TYPE_NAME)
;

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

delimiter //
CREATE TRIGGER IF NOT EXISTS TR_U_T_IDENTITY_LM
BEFORE UPDATE ON T_IDENTITY FOR EACH ROW
BEGIN
  set new.LAST_MODIFIED  = current_timestamp ;
END;//

delimiter //
CREATE TRIGGER IF NOT EXISTS TR_U_T_IDENTITY_LM2
BEFORE INSERT ON T_IDENTITY FOR EACH ROW
BEGIN
  set new.LAST_MODIFIED  = current_timestamp ;
  set new.start_date = current_timestamp ;
  set new.end_date = '9999-01-01 00:00:00' ;
END;//

------------

delimiter //
CREATE TRIGGER IF NOT EXISTS TR_U_T_IDENTITY_TO_IDENTITY_LM
BEFORE UPDATE ON T_IDENTITY_TO_IDENTITY FOR EACH ROW
BEGIN
  set new.LAST_MODIFIED = current_timestamp ;
END;//

delimiter //
CREATE TRIGGER IF NOT EXISTS TR_U_T_IDENTITY_TO_IDENTITY_LM2
BEFORE INSERT ON T_IDENTITY_TO_IDENTITY FOR EACH ROW
BEGIN
  set new.LAST_MODIFIED = current_timestamp ;
END;//

------------

delimiter //
CREATE TRIGGER IF NOT EXISTS TR_U_T_IDENTITY_TO_RIGHT_LM
BEFORE UPDATE ON T_IDENTITY_TO_RIGHT FOR EACH ROW
BEGIN
  set new.LAST_MODIFIED = current_timestamp ;
END;//

delimiter //
CREATE TRIGGER IF NOT EXISTS TR_U_T_IDENTITY_TO_RIGHT_LM2
BEFORE INSERT ON T_IDENTITY_TO_RIGHT FOR EACH ROW
BEGIN
  set new.LAST_MODIFIED = current_timestamp ;
END;//

------------

delimiter //
CREATE TRIGGER IF NOT EXISTS TR_U_T_IDENTITY_TYPE_LM
BEFORE UPDATE ON T_IDENTITY_TYPE FOR EACH ROW
BEGIN
  set new.LAST_MODIFIED  = current_timestamp ;
END;//

delimiter //
CREATE TRIGGER IF NOT EXISTS TR_U_T_IDENTITY_TYPE_LM2
BEFORE INSERT ON T_IDENTITY_TYPE FOR EACH ROW
BEGIN
  set new.LAST_MODIFIED  = current_timestamp ;
END;//

------------

delimiter //
CREATE TRIGGER IF NOT EXISTS TR_U_T_RIGHT_LM
BEFORE UPDATE ON T_RIGHT FOR EACH ROW
BEGIN
  set new.LAST_MODIFIED  = current_timestamp ;
END;//

delimiter //
CREATE TRIGGER IF NOT EXISTS TR_U_T_RIGHT_LM2
BEFORE INSERT ON T_RIGHT FOR EACH ROW
BEGIN
  set new.LAST_MODIFIED  = current_timestamp ;
END;//

------------

CREATE view V_IDENTITY_TO_IDENTITY
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
from T_IDENTITY_TO_IDENTITY a, T_IDENTITY b, T_IDENTITY_TYPE c 
where a.PARENT_IDENTITY_KEY=b.IDENTITY_KEY and b.IDENTITY_TYPE_KEY=c.IDENTITY_TYPE_KEY;


CREATE VIEW V_IDENTITY_TO_RIGHT
AS 
SELECT 
  B.identity_key 
, B.identity_name 
, C.right_key 
, C.right_name 
, A.right_value 
, A.right_context 
, A.last_modified 
FROM T_IDENTITY_TO_RIGHT A, T_IDENTITY B, T_RIGHT C 
WHERE A.IDENTITY_KEY = B.IDENTITY_KEY 
AND A.RIGHT_KEY = C.RIGHT_KEY;

CREATE VIEW V_IDENTITY
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
where a.IDENTITY_KEY=b.IDENTITY_KEY and a.IDENTITY_TYPE_KEY=c.IDENTITY_TYPE_KEY;
