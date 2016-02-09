-- Identity Types--------------------------------------------------

INSERT INTO T_IDENTITY_TYPE ( IDENTITY_TYPE_KEY, IDENTITY_TYPE_NAME ) VALUES ( 1, 'Group' ) ;

INSERT INTO T_IDENTITY_TYPE ( IDENTITY_TYPE_KEY, IDENTITY_TYPE_NAME ) VALUES ( 2, 'Person' ) ;

-- Root -----------------------------------------------------------
INSERT INTO T_IDENTITY ( IDENTITY_NAME, IDENTITY_TYPE_KEY, DESCRIPTION, ENABLED, LOGIN_ENABLED )
VALUES ( 'RootGroup', ( select IDENTITY_TYPE_KEY from T_IDENTITY_TYPE where IDENTITY_TYPE_NAME='Group' ), 'Root group', '1', '0' ) ;

INSERT INTO T_IDENTITY ( IDENTITY_NAME, IDENTITY_TYPE_KEY, DESCRIPTION, ENABLED, LOGIN_ENABLED, PWD )
VALUES ( 'root', ( select IDENTITY_TYPE_KEY from T_IDENTITY_TYPE where IDENTITY_TYPE_NAME='Person' ), 'Root user', '1', '1', '654321' ) ;

INSERT INTO T_IDENTITY_TO_IDENTITY ( PARENT_IDENTITY_KEY, IDENTITY_KEY )
VALUES ( ( select IDENTITY_KEY from T_IDENTITY where IDENTITY_NAME='RootGroup' ), ( select IDENTITY_KEY from T_IDENTITY where IDENTITY_NAME='root' ) ) ;


-- Rights ---------------------------------------------------------

INSERT INTO T_RIGHT ( RIGHT_NAME ) VALUES ( 'CAN_EDIT_USER_OF' ) ; 

INSERT INTO T_RIGHT ( RIGHT_NAME ) VALUES ( 'CAN_EDIT_USER' ) ; 

INSERT INTO T_RIGHT ( RIGHT_NAME ) VALUES ( 'CAN_EDIT_GROUP' ) ; 

-- Group To Rights -------------------------------------------------

INSERT INTO T_IDENTITY_TO_RIGHT ( IDENTITY_KEY, RIGHT_KEY, RIGHT_CONTEXT, RIGHT_VALUE )
VALUES ( (select IDENTITY_KEY from T_IDENTITY where IDENTITY_NAME='RootGroup')
       , (select RIGHT_KEY from T_RIGHT where RIGHT_NAME='CAN_EDIT_USER_OF')
       , '*'
       , '*'
       );

INSERT INTO T_IDENTITY_TO_RIGHT ( IDENTITY_KEY, RIGHT_KEY, RIGHT_CONTEXT, RIGHT_VALUE )
VALUES ( (select IDENTITY_KEY from T_IDENTITY where IDENTITY_NAME='RootGroup')
       , (select RIGHT_KEY from T_RIGHT where RIGHT_NAME='CAN_EDIT_USER')
       , '*'
       , 'true'
       );

INSERT INTO T_IDENTITY_TO_RIGHT ( IDENTITY_KEY, RIGHT_KEY, RIGHT_CONTEXT, RIGHT_VALUE )
VALUES ( (select IDENTITY_KEY from T_IDENTITY where IDENTITY_NAME='RootGroup')
       , (select RIGHT_KEY from T_RIGHT where RIGHT_NAME='CAN_EDIT_GROUP')
       , '*'
       , 'true'
       );

----------------------------------------------------------------------
	   
commit ;

exit
