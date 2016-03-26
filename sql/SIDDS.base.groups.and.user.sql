-- Identity Types--------------------------------------------------

INSERT INTO t_identity_type ( IDENTITY_TYPE_KEY, IDENTITY_TYPE_NAME ) VALUES ( 1, 'Person' ) ;

INSERT INTO t_identity_type ( IDENTITY_TYPE_KEY, IDENTITY_TYPE_NAME ) VALUES ( 2, 'Group' ) ;

-- Rights ---------------------------------------------------------

INSERT INTO t_right ( RIGHT_NAME ) VALUES ( 'CAN_EDIT_USER_OF' ) ; 

INSERT INTO t_right ( RIGHT_NAME ) VALUES ( 'CAN_EDIT_USER' ) ; 

INSERT INTO t_right ( RIGHT_NAME ) VALUES ( 'CAN_EDIT_GROUP' ) ; 

-- Root -----------------------------------------------------------
INSERT INTO t_identity ( IDENTITY_NAME, IDENTITY_TYPE_KEY, DESCRIPTION, ENABLED, LOGIN_ENABLED )
VALUES ( 'RootGroup', ( select IDENTITY_TYPE_KEY from t_identity_type where IDENTITY_TYPE_NAME='Group' ), 'Root group', '1', '0' ) ;

INSERT INTO t_identity ( IDENTITY_NAME, IDENTITY_TYPE_KEY, DESCRIPTION, ENABLED, LOGIN_ENABLED, PWD )
VALUES ( 'root', ( select IDENTITY_TYPE_KEY from t_identity_type where IDENTITY_TYPE_NAME='Person' ), 'Root user', '1', '1', '654321' ) ;

INSERT INTO t_identity_to_identity ( parent_identity_key, IDENTITY_KEY )
VALUES ( ( select IDENTITY_KEY from t_identity where IDENTITY_NAME='RootGroup' ), ( select IDENTITY_KEY from t_identity where IDENTITY_NAME='root' ) ) ;


-- Admin ----------------------------------------------------------
INSERT INTO t_identity ( IDENTITY_NAME, IDENTITY_TYPE_KEY, DESCRIPTION, ENABLED, LOGIN_ENABLED )
VALUES ( 'AdminGroup', ( select IDENTITY_TYPE_KEY from t_identity_type where IDENTITY_TYPE_NAME='Group' ), 'Root group', '1', '0' ) ;

INSERT INTO t_identity ( IDENTITY_NAME, IDENTITY_TYPE_KEY, DESCRIPTION, ENABLED, LOGIN_ENABLED, PWD )
VALUES ( 'admin', ( select IDENTITY_TYPE_KEY from t_identity_type where IDENTITY_TYPE_NAME='Person' ), 'admin user', '1', '1', '654321' ) ;

INSERT INTO t_identity_to_identity ( parent_identity_key, IDENTITY_KEY )
VALUES ( ( select IDENTITY_KEY from t_identity where IDENTITY_NAME='AdminGroup' ), ( select IDENTITY_KEY from t_identity where IDENTITY_NAME='admin' ) ) ;

INSERT INTO t_identity_to_right ( IDENTITY_KEY, RIGHT_KEY )
VALUES ( (select IDENTITY_KEY from t_identity where IDENTITY_NAME='AdminGroup')
       , (select RIGHT_KEY from t_right where RIGHT_NAME='CAN_EDIT_USER')
       );

-- Customer Group ----------------------------------------------------
INSERT INTO t_identity ( IDENTITY_NAME, IDENTITY_TYPE_KEY, DESCRIPTION, ENABLED, LOGIN_ENABLED )
VALUES ( 'CustomerGroup', ( select IDENTITY_TYPE_KEY from t_identity_type where IDENTITY_TYPE_NAME='Group' ), 'Customer group', '1', '0' ) ;

-- Key Account Customer Customer Group -------------------------------
INSERT INTO t_identity ( IDENTITY_NAME, IDENTITY_TYPE_KEY, DESCRIPTION, ENABLED, LOGIN_ENABLED )
VALUES ( 'KeyAccountCustomerGroup', ( select IDENTITY_TYPE_KEY from t_identity_type where IDENTITY_TYPE_NAME='Group' ), 'Key Account Customer group', '1', '0' ) ;

INSERT INTO t_right ( RIGHT_NAME ) VALUES ( 'CAN_PURCHASE_GOLD_CARD' ) ; 

INSERT INTO t_identity_to_right ( IDENTITY_KEY, RIGHT_KEY )
VALUES ( (select IDENTITY_KEY from t_identity where IDENTITY_NAME='KeyAccountCustomerGroup')
       , (select RIGHT_KEY from t_right where RIGHT_NAME='CAN_PURCHASE_GOLD_CARD')
       );

INSERT INTO t_identity_to_identity ( parent_identity_key, IDENTITY_KEY )
VALUES ( ( select IDENTITY_KEY from t_identity where IDENTITY_NAME='CustomerGroup' ),
 ( select IDENTITY_KEY from t_identity where IDENTITY_NAME='KeyAccountCustomerGroup' ) ) ;

-- Customer ----------------------------------------------------------

INSERT INTO t_right ( RIGHT_NAME ) VALUES ( 'CAN_PURCHASE_PRODUCTS' ) ; 

INSERT INTO t_identity_to_right ( IDENTITY_KEY, RIGHT_KEY )
VALUES ( (select IDENTITY_KEY from t_identity where IDENTITY_NAME='CustomerGroup')
       , (select RIGHT_KEY from t_right where RIGHT_NAME='CAN_PURCHASE_PRODUCTS')
       );

INSERT INTO t_identity ( IDENTITY_NAME, IDENTITY_TYPE_KEY, DESCRIPTION, ENABLED, LOGIN_ENABLED, PWD )
VALUES ( 'miller', ( select IDENTITY_TYPE_KEY from t_identity_type where IDENTITY_TYPE_NAME='Person' ), 'customer and admin', '1', '1', '654321' ) ;

INSERT INTO t_identity_to_identity ( parent_identity_key, IDENTITY_KEY )
VALUES ( ( select IDENTITY_KEY from t_identity where IDENTITY_NAME='AdminGroup' ), ( select IDENTITY_KEY from t_identity where IDENTITY_NAME='miller' ) ) ;

INSERT INTO t_identity_to_identity ( parent_identity_key, IDENTITY_KEY )
VALUES ( ( select IDENTITY_KEY from t_identity where IDENTITY_NAME='CustomerGroup' ), ( select IDENTITY_KEY from t_identity where IDENTITY_NAME='miller' ) ) ;

INSERT INTO t_identity_to_identity ( parent_identity_key, IDENTITY_KEY )
VALUES ( ( select IDENTITY_KEY from t_identity where IDENTITY_NAME='KeyAccountCustomerGroup' ), ( select IDENTITY_KEY from t_identity where IDENTITY_NAME='miller' ) ) ;

-- Group To Rights -------------------------------------------------

INSERT INTO t_identity_to_right ( IDENTITY_KEY, RIGHT_KEY, RIGHT_VALUE )
VALUES ( (select IDENTITY_KEY from t_identity where IDENTITY_NAME='RootGroup')
       , (select RIGHT_KEY from t_right where RIGHT_NAME='CAN_EDIT_USER_OF')
       , '*'
       );

INSERT INTO t_identity_to_right ( IDENTITY_KEY, RIGHT_KEY )
VALUES ( (select IDENTITY_KEY from t_identity where IDENTITY_NAME='RootGroup')
       , (select RIGHT_KEY from t_right where RIGHT_NAME='CAN_EDIT_USER')
       );

INSERT INTO t_identity_to_right ( IDENTITY_KEY, RIGHT_KEY )
VALUES ( (select IDENTITY_KEY from t_identity where IDENTITY_NAME='RootGroup')
       , (select RIGHT_KEY from t_right where RIGHT_NAME='CAN_EDIT_GROUP')
       );

commit ;