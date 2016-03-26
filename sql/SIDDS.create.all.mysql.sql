CREATE TABLE t_identity_type
(
  identity_type_key   INTEGER NOT NULL AUTO_INCREMENT,
  identity_type_name  VARCHAR(64)         NOT NULL,
  description         VARCHAR(128),
  last_modified       DATETIME                      NOT NULL,
  operator_modified   INTEGER,
  PRIMARY KEY ( identity_type_key )
);

CREATE TABLE t_identity
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

CREATE TABLE t_identity_to_identity
(
  parent_identity_key  INTEGER                  NOT NULL,
  identity_key         INTEGER                  NOT NULL,
  last_modified        DATEtime                 NOT NULL,
  operator_modified    INTEGER,
  FOREIGN KEY(PARENt_identity_KEY) REFERENCES t_identity(identity_key) ON DELETE CASCADE,
  FOREIGN KEY(identity_key) REFERENCES t_identity(identity_key) ON DELETE CASCADE
);

-- -------------

CREATE TABLE t_right
(
  right_key          INTEGER AUTO_INCREMENT NOT NULL,
  right_name         VARCHAR(64)          NOT NULL,
  description        VARCHAR(128),
  last_modified      DATETIME                       NOT NULL,
  operator_modified  INTEGER,
  PRIMARY KEY ( right_key )
);

CREATE TABLE t_identity_to_right
(
  identity_key       INTEGER                    NOT NULL,
  right_key          INTEGER                    NOT NULL,
  last_modified      datetime                       NOT NULL,
  right_value        VARCHAR(512)         DEFAULT 'true' NOT NULL,
  right_context      VARCHAR(128)         DEFAULT '*'                   NOT NULL,
  operator_modified  INTEGER,
  FOREIGN KEY(identity_key) REFERENCES t_identity(identity_key) ON DELETE CASCADE,
  FOREIGN KEY(right_key) REFERENCES t_right(right_key) ON DELETE CASCADE
);

CREATE UNIQUE INDEX i_t_identity_type
ON t_identity_type
(identity_type_name)
;

CREATE UNIQUE INDEX i_t_identity_name
ON t_identity
(identity_name)
;

CREATE UNIQUE INDEX i_t_right_name
ON t_right
(right_name)
;

CREATE UNIQUE INDEX i_t_identity_to_identity
ON t_identity_to_identity
(parent_identity_key, identity_key)
;

CREATE UNIQUE INDEX i_t_identity_to_right
ON t_identity_to_right
(identity_key, right_key)
;

delimiter //
CREATE TRIGGER tr_u_t_identity_lm
BEFORE UPDATE ON t_identity FOR EACH ROW
BEGIN
  set new.last_modified  = current_timestamp ;
END;//

delimiter //
CREATE TRIGGER tr_u_t_identity_lm2
BEFORE INSERT ON t_identity FOR EACH ROW
BEGIN
  set new.last_modified  = current_timestamp ;
  set new.start_date = current_timestamp ;
  set new.end_date = '9999-01-01 00:00:00' ;
END;//

delimiter //
CREATE TRIGGER tr_u_t_identity_to_identity_lm
BEFORE UPDATE ON t_identity_to_identity FOR EACH ROW
BEGIN
  set new.last_modified = current_timestamp ;
END;//

delimiter //
CREATE TRIGGER tr_u_t_identity_to_identity_lm2
BEFORE INSERT ON t_identity_to_identity FOR EACH ROW
BEGIN
  set new.last_modified = current_timestamp ;
END;//

delimiter //
CREATE TRIGGER tr_u_t_identity_to_right_lm
BEFORE UPDATE ON t_identity_to_right FOR EACH ROW
BEGIN
  set new.last_modified = current_timestamp ;
END;//

delimiter //
CREATE TRIGGER tr_u_t_identity_to_right_lm2
BEFORE INSERT ON t_identity_to_right FOR EACH ROW
BEGIN
  set new.last_modified = current_timestamp ;
END;//

delimiter //
CREATE TRIGGER tr_u_t_identity_type_lm
BEFORE UPDATE ON t_identity_type FOR EACH ROW
BEGIN
  set new.last_modified  = current_timestamp ;
END;//

delimiter //
CREATE TRIGGER tr_u_t_identity_type_lm2
BEFORE INSERT ON t_identity_type FOR EACH ROW
BEGIN
  set new.last_modified  = current_timestamp ;
END;//

delimiter //
CREATE TRIGGER tr_u_t_right_lm
BEFORE UPDATE ON t_right FOR EACH ROW
BEGIN
  set new.last_modified  = current_timestamp ;
END;//

delimiter //
CREATE TRIGGER tr_u_t_right_lm2
BEFORE INSERT ON t_right FOR EACH ROW
BEGIN
  set new.last_modified  = current_timestamp ;
END;//

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
-- , b.PARENt_identity_NAME 
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
