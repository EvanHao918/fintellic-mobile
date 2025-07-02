import { Theme } from 'react-native-elements';

export const theme: Theme = {
  colors: {
    primary: '#1A73E8',
    secondary: '#F1F3F4',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    grey0: '#393e42',
    grey1: '#43484d',
    grey2: '#5e6977',
    grey3: '#86939e',
    grey4: '#bdc6cf',
    grey5: '#e1e8ee',
    greyOutline: '#bbb',
    searchBg: '#303337',
    disabled: 'rgba(0, 0, 0, 0.38)',
    divider: 'rgba(0, 0, 0, 0.12)',
  },
  Text: {
    style: {
      fontSize: 16,
      color: '#212121',
    },
  },
  Button: {
    titleStyle: {
      fontSize: 16,
      fontWeight: '600',
    },
    buttonStyle: {
      borderRadius: 8,
      paddingVertical: 12,
    },
  },
  Input: {
    inputStyle: {
      fontSize: 16,
    },
    inputContainerStyle: {
      borderBottomColor: '#E0E0E0',
    },
  },
};