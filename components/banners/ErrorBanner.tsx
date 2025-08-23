import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, Dimensions } from 'react-native';

interface Props {
  message: string;
  onHide: () => void;
}

// Sanitize error messages to remove any sensitive information
const sanitizeErrorMessage = (message: string): string => {
  if (!message) return '';
  
  // Check for sensitive patterns
  if (message.includes('price_') || message.includes('STRIPE_PRO_PRICE_ID')) {
    return 'Payment setup error. Please try again later.';
  }
  
  if (message.includes('cus_') || message.includes('customerId') || message.includes('Customer')) {
    return 'Account verification error. Please try again later.';
  }
  
  if (message.includes('sub_') || message.includes('subscriptionId')) {
    return 'Subscription error. Please try again later.';
  }
  
  if (message.includes('sk_') || message.includes('pk_')) {
    return 'Authentication error. Please try again later.';
  }
  
  // Generic payment/card errors should be user-friendly
  if (message.includes('card') || message.includes('payment')) {
    return 'Payment error. Please check your card details and try again.';
  }
  
  // If it's a technical error with JSON, server communication, etc.
  if (message.includes('JSON') || message.includes('network') || message.includes('fetch')) {
    return 'Connection error. Please check your internet and try again.';
  }
  
  // Allow common user errors to pass through as they don't contain sensitive info
  return message;
};

export default function ErrorBanner({ message, onHide }: Props) {
  const startY = -145;
  const slideTop = useRef(new Animated.Value(startY)).current;
  const { width } = Dimensions.get('window');
  
  // Sanitize the error message
  const sanitizedMessage = sanitizeErrorMessage(message);

  useEffect(() => {
    if (!sanitizedMessage) return;
    Animated.sequence([
      Animated.timing(slideTop, {
        toValue: 0,            
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.delay(3000),
      Animated.timing(slideTop, {
        toValue: startY,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start(onHide);
  }, [sanitizedMessage]);

  if (!sanitizedMessage) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        { top: slideTop, width },
      ]}
    >
      <Text style={styles.text}>{sanitizedMessage}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left:     0,
    height:   105,
    backgroundColor: '#E74C3C',
    zIndex:   1000,
    justifyContent: 'center',
    alignItems:     'center',
    paddingHorizontal: 12,
    paddingTop: 60,
    paddingBottom: 15
  },
  text: {
    color:    '#fff',
    fontSize: 14,
    fontFamily: 'SpaceMono',
    textAlign: 'center',
    flexWrap: 'wrap',  
    width: '100%',
  },
});
