CREATE TABLE T_IDENTITY_TYPE
(
  identity_type_key   SERIAL,
  identity_type_name  VARCHAR(64)         NOT NULL,
  description         VARCHAR(128),
  last_modified       timestamp                      DEFAULT date_trunc('second', CURRENT_TIMESTAMP )               NOT NULL,
  operator_modified   INTEGER,
  PRIMARY KEY ( IDENTITY_TYPE_KEY )
);

  --START_DATE           timestamp    default current_timestamp            NOT NULL,
CREATE TABLE T_IDENTITY
(
  identity_key         SERIAL,
  identity_name        VARCHAR(64)             NOT NULL,
  identity_type_key    INTEGER                  NOT NULL,
  description          VARCHAR(128)                NULL,
  salt                 INTEGER                      NULL,
  enabled              CHAR(1)                  DEFAULT '1'                   NOT NULL,
  login_enabled        CHAR(1)                  DEFAULT  '1'                   NOT NULL,
  pwd                  VARCHAR(128)                NULL,
  start_date           timestamp    DEFAULT current_timestamp NOT NULL,
  end_date             timestamp                    DEFAULT '9999-01-01 00:00:00' NOT NULL,
  last_modified        timestamp             DEFAULT date_trunc('second', CURRENT_TIMESTAMP )   NOT NULL,
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
  PRIMARY KEY ( IDENTITY_KEY ),
  FOREIGN KEY (IDENTITY_TYPE_KEY) 
        REFERENCES T_IDENTITY_TYPE(IDENTITY_TYPE_KEY)
        ON DELETE CASCADE
);

CREATE TABLE T_IDENTITY_TO_IDENTITY
(
  parent_identity_key  INTEGER                  NOT NULL,
  identity_key         INTEGER                  NOT NULL,
  last_modified        timestamp                 DEFAULT date_trunc('second', CURRENT_TIMESTAMP )               NOT NULL,
  operator_modified    INTEGER,
  FOREIGN KEY(PARENT_IDENTITY_KEY) REFERENCES T_IDENTITY(IDENTITY_KEY) ON DELETE CASCADE,
  FOREIGN KEY(IDENTITY_KEY) REFERENCES T_IDENTITY(IDENTITY_KEY) ON DELETE CASCADE
);

---------------

CREATE TABLE T_RIGHT
(
  right_key          SERIAL,
  right_name         VARCHAR(64)          NOT NULL,
  description        VARCHAR(128),
  last_modified      timestamp                       DEFAULT date_trunc('second', CURRENT_TIMESTAMP )               NOT NULL,
  operator_modified  INTEGER,
  PRIMARY KEY ( RIGHT_KEY )
);

CREATE TABLE T_IDENTITY_TO_RIGHT
(
  identity_key       INTEGER                    NOT NULL,
  right_key          INTEGER                    NOT NULL,
  last_modified      timestamp                       DEFAULT date_trunc('second', CURRENT_TIMESTAMP )               NOT NULL,
  right_value        VARCHAR(512)         DEFAULT 'true' NOT NULL,
  right_context      VARCHAR(128)         DEFAULT '*'                   NOT NULL,
  operator_modified  INTEGER,
  FOREIGN KEY(IDENTITY_KEY) REFERENCES T_IDENTITY(IDENTITY_KEY) ON DELETE CASCADE,
  FOREIGN KEY(RIGHT_KEY) REFERENCES T_RIGHT(RIGHT_KEY) ON DELETE CASCADE
);

CREATE UNIQUE INDEX I_T_IDENTITY_NAME
ON T_IDENTITY
(IDENTITY_NAME)
;

CREATE UNIQUE INDEX I_T_RIGHT_NAME
ON T_RIGHT
(RIGHT_NAME)
;

CREATE UNIQUE INDEX I_T_IDENTITY_TO_IDENTITY
ON T_IDENTITY_TO_IDENTITY
(PARENT_IDENTITY_KEY, IDENTITY_KEY)
;

CREATE UNIQUE INDEX I_T_IDENTITY_TO_RIGHT
ON T_IDENTITY_TO_RIGHT
(IDENTITY_KEY, RIGHT_KEY)
;

CREATE OR REPLACE FUNCTION f_last_modified()
  RETURNS trigger AS
$BODY$
BEGIN
  NEW.LAST_MODIFIED:=date_trunc('second', CURRENT_TIMESTAMP ) ;
  RETURN NEW ;
END;$BODY$
  LANGUAGE 'plpgsql' VOLATILE
  COST 100;

DROP TRIGGER TR_T_IDENTITY_LM ON T_IDENTITY CASCADE ;
CREATE TRIGGER TR_T_IDENTITY_LM BEFORE INSERT OR UPDATE ON T_IDENTITY FOR EACH ROW EXECUTE PROCEDURE F_LAST_MODIFIED() ;

DROP TRIGGER TR_T_IDENTITY_TO_IDENTITY_LM ON T_IDENTITY_TO_IDENTITY CASCADE ;
CREATE TRIGGER TR_T_IDENTITY_TO_IDENTITY_LM BEFORE INSERT OR UPDATE ON T_IDENTITY_TO_IDENTITY FOR EACH ROW EXECUTE PROCEDURE F_LAST_MODIFIED() ;

DROP TRIGGER TR_T_IDENTITY_TO_RIGHT_LM ON T_IDENTITY_TO_RIGHT CASCADE ;
CREATE TRIGGER TR_T_IDENTITY_TO_RIGHT_LM BEFORE INSERT OR UPDATE ON T_IDENTITY_TO_RIGHT FOR EACH ROW EXECUTE PROCEDURE F_LAST_MODIFIED() ;

DROP TRIGGER TR_T_IDENTITY_TYPE_LM ON T_IDENTITY_TYPE CASCADE ;
CREATE TRIGGER TR_T_IDENTITY_TYPE_LM BEFORE INSERT OR UPDATE ON T_IDENTITY_TYPE FOR EACH ROW EXECUTE PROCEDURE F_LAST_MODIFIED() ;

DROP TRIGGER TR_T_RIGHT_LM ON T_RIGHT CASCADE ;
CREATE TRIGGER TR_T_RIGHT_LM BEFORE INSERT OR UPDATE ON T_RIGHT FOR EACH ROW EXECUTE PROCEDURE F_LAST_MODIFIED() ;

CREATE OR REPLACE VIEW V_IDENTITY_TO_IDENTITY
(identity_key, parent_identity_key, parent_identity_name, enabled, login_enabled, 
 end_date, identity_type_key, identity_type_name)
AS 
SELECT 
  a.IDENTITY_KEY 
, PARENT_IDENTITY_KEY 
, b.IDENTITY_NAME 
, b.ENABLED 
, b.LOGIN_ENABLED 
, b.END_DATE 
, c.IDENTITY_TYPE_KEY 
, c.IDENTITY_TYPE_NAME 
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

CREATE OR REPLACE VIEW V_IDENTITY
(identity_name, identity_key, first_name, last_name, email, 
 identity_type_key, identity_type_name, description, parent_identity_key, parent_identity_name, 
 enabled, start_date, end_date, last_modified, operator_modified, 
 full_name, login_enabled, phone, email2,external_key,external_id)
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
, b.parent_identity_name 
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
 from t_identity a, v_identity_to_identity b, t_identity_type c 
where a.IDENTITY_KEY=b.IDENTITY_KEY and a.IDENTITY_TYPE_KEY=c.IDENTITY_TYPE_KEY;

commit ;