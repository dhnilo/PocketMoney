import React from 'react';
import Colors from '@/app/constants/Colors';
import { defaultStyles } from '@/app/constants/Styles';
import { isClerkAPIResponseError, useSignIn, useSignUp, useSession } from '@clerk/clerk-expo';
import { Link, useLocalSearchParams } from 'expo-router';
import { Fragment, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import {
  CodeField,
  Cursor,
  useBlurOnFulfill,
  useClearByFocusCell,
} from 'react-native-confirmation-code-field';
import { UserIDContext } from '../context/UserID';


const CELL_COUNT = 6;

const Page = () => {
  const { phone, signin } = useLocalSearchParams<{ phone: string; signin: string }>();
  const [code, setCode] = useState('');
  const { signIn } = useSignIn();
  const { signUp, setActive } = useSignUp();
  const { session } = useSession();
  const userIDContext = React.useContext(UserIDContext);

  if (!userIDContext) {
    throw new Error('UserIDContext is null');
  }
  
  const { userID, setUserID } = userIDContext;

  const ref = useBlurOnFulfill({ value: code, cellCount: CELL_COUNT });
  const [props, getCellOnLayoutHandler] = useClearByFocusCell({
    value: code,
    setValue: setCode,
  });

  useEffect(() => {
    if (code.length === 6) {
      if (signin === 'true') {
        verifySignIn();
      } else {
        verifyCode();
      }
    }
  }, [code]);

  useEffect(() => {
    console.log('userID has been updated', userID);
    console.log('userIDContext.userID', userIDContext.userID);
  }, [userID, userIDContext.userID]);

  useEffect(() => {
    if (session) {
      console.log('Session created', session);
      const clerk_id = session.user.id;
      console.log('clerk_id', clerk_id);
      setUserID(clerk_id);

      // Check if clerk_id already exists
      fetch(`http://localhost:8000/check_clerk_id/${clerk_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then(response => response.text())
        .then(text => {
            console.log('text', text);
            const data = JSON.parse(text);
            console.log('data', data);
          if (!data.exists) {
            // Send the clerk_id, an empty access_token, and an empty items array to the server
            fetch('http://localhost:8000/store_user_data', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                clerk_id,
                access_token: '',
                items: [],
              }),
            })
              .then(response => response.json())
              .then(data => {
                console.log(data);
                setUserID(data._id);
              })
              .catch(error => console.error('Error:', error));
          }
        })
        .catch(error => console.error('Error:', error));
    } else {
      console.log('No session');
    }
  }, [session]);

  useEffect(() => {
    console.log('userID', userIDContext.userID);
  }, [userIDContext.userID]);

  const verifyCode = async () => {
    try {
      await signUp!.attemptPhoneNumberVerification({
        code,
      });

      const updatedSession = await setActive!({ session: signUp!.createdSessionId });
      console.log('updatedSession', updatedSession);
    } catch (err) {
      console.log('error', JSON.stringify(err, null, 2));
      if (isClerkAPIResponseError(err)) {
        Alert.alert('Error', err.errors[0].message);
      }
    }
  };

  const verifySignIn = async () => {
    try {
      await signIn!.attemptFirstFactor({
        strategy: 'phone_code',
        code,
      });
      const updatedSession = await setActive!({ session: signIn!.createdSessionId });
      console.log('updatedSession', updatedSession);
    } catch (err) {
      console.log('error', JSON.stringify(err, null, 2));
      if (isClerkAPIResponseError(err)) {
        Alert.alert('Error', err.errors[0].message);
      }
    }
  };

  return (
    <View style={defaultStyles.container}>
      <Text style={defaultStyles.header}>6-digit code</Text>
      <Text style={defaultStyles.descriptionText}>
        Code sent to {phone} unless you already have an account
      </Text>

      {/* Code input field */}
      <CodeField
        ref={ref}
        {...props}
        value={code}
        onChangeText={setCode}
        cellCount={CELL_COUNT}
        rootStyle={styles.codeFieldRoot}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        renderCell={({ index, symbol, isFocused }) => (
          <Fragment key={index}>
            <View
              // Make sure that you pass onLayout={getCellOnLayoutHandler(index)} prop to root component of "Cell"
              onLayout={getCellOnLayoutHandler(index)}
              key={index}
              style={[styles.cellRoot, isFocused && styles.focusCell]}>
              <Text style={styles.cellText}>{symbol || (isFocused ? <Cursor /> : null)}</Text>
            </View>
            {index === 2 ? <View key={`separator-${index}`} style={styles.separator} /> : null}
          </Fragment>
        )}
      />

      <Link href={'/login'} replace asChild>
        <TouchableOpacity>
          <Text style={[defaultStyles.textLink]}>Already have an account? Log in</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
};

const styles = StyleSheet.create({
  codeFieldRoot: {
    marginVertical: 20,
    marginLeft: 'auto',
    marginRight: 'auto',
    gap: 12,
  },
  cellRoot: {
    width: 45,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
  },
  cellText: {
    color: '#000',
    fontSize: 36,
    textAlign: 'center',
  },
  focusCell: {
    paddingBottom: 8,
  },
  separator: {
    height: 2,
    width: 10,
    backgroundColor: Colors.gray,
    alignSelf: 'center',
  },
});
export default Page;