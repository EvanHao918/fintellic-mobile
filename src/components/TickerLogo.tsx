// src/components/TickerLogo.tsx
// Real company logo from the shared backend (/companies/{tk}/logo → Massive branding icon).
// Mirrors web's <img onerror>: on load failure or missing ticker, falls back to the colored
// letter avatar. Same source of truth as the web app.
import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { API_BASE_URL } from '../utils/constants';
import { avatarColor, avatarLetters } from '../theme/allsight';

interface Props {
  ticker?: string;
  name?: string;
  style?: StyleProp<ViewStyle>;      // container/dimension style (e.g. styles.av)
  textStyle?: StyleProp<TextStyle>;  // fallback letter style (e.g. styles.avTxt)
}

const TickerLogo: React.FC<Props> = ({ ticker, name, style, textStyle }) => {
  const tk = (ticker || '').toUpperCase();
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [tk]); // reset when recycled onto a new ticker

  if (failed || !tk) {
    return (
      <View style={[style, { backgroundColor: avatarColor(tk || name || ''), alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={textStyle}>{avatarLetters(tk, name)}</Text>
      </View>
    );
  }
  return (
    <Image
      source={{ uri: `${API_BASE_URL}/companies/${encodeURIComponent(tk)}/logo` }}
      style={[style as any, { backgroundColor: '#fff' }]}
      resizeMode="contain"
      onError={() => setFailed(true)}
    />
  );
};

export default TickerLogo;
