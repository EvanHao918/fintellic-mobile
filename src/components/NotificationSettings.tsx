// src/components/NotificationSettings.tsx
// SIMPLIFIED: Core filing preferences only, removed redundant features
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { notificationAPI, notificationHelpers } from '../api/notifications';
import { NotificationSettings as NotificationSettingsType } from '../types/notification';

interface NotificationSettingsProps {
  settings: NotificationSettingsType | null;
  loading: boolean;
  onToggle: (key: string, value: boolean) => void;
  onSave: () => void;
  saving: boolean;
  expanded?: boolean;
}

// SIMPLIFIED: Core filing types only
const FILING_TYPE_LABELS = {
  filing_10k: { title: 'Annual Reports (10-K)', description: 'Comprehensive yearly financial reports' },
  filing_10q: { title: 'Quarterly Reports (10-Q)', description: 'Quarterly financial updates' },
  filing_8k: { title: 'Current Reports (8-K)', description: 'Major events and announcements' },
  filing_s1: { title: 'IPO Filings (S-1)', description: 'Initial public offering registrations' },
};

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  settings,
  loading,
  onToggle,
  onSave,
  saving,
  expanded = true,
}) => {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#4CAF50" />
      </View>
    );
  }

  if (!settings) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load notification settings</Text>
      </View>
    );
  }

  if (!expanded) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Master Switch */}
      <View style={styles.section}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <View style={styles.iconContainer}>
              <Ionicons name="notifications" size={24} color="#4CAF50" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.settingTitle}>Push Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive alerts for new SEC filings
              </Text>
            </View>
          </View>
          <Switch
            value={settings.notification_enabled}
            onValueChange={(value) => onToggle('notification_enabled', value)}
            trackColor={{ false: '#E0E0E0', true: '#81C784' }}
            thumbColor={settings.notification_enabled ? '#4CAF50' : '#9E9E9E'}
          />
        </View>
      </View>

      {/* Watchlist Only */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>NOTIFICATION SCOPE</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <View style={styles.iconContainer}>
              <Ionicons name="star" size={24} color="#FFA726" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.settingTitle}>Watchlist Only</Text>
              <Text style={styles.settingDescription}>
                Only get notified about companies you follow
              </Text>
            </View>
          </View>
          <Switch
            value={settings.watchlist_only}
            onValueChange={(value) => onToggle('watchlist_only', value)}
            trackColor={{ false: '#E0E0E0', true: '#FFB74D' }}
            thumbColor={settings.watchlist_only ? '#FFA726' : '#9E9E9E'}
            disabled={!settings.notification_enabled}
          />
        </View>
      </View>

      {/* Filing Types - CORE FUNCTIONALITY ONLY */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>FILING TYPES</Text>
        {Object.entries(FILING_TYPE_LABELS).map(([key, label]) => (
          <View key={key} style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={styles.iconContainer}>
                <Ionicons name="document-text" size={24} color="#42A5F5" />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.settingTitle}>{label.title}</Text>
                <Text style={styles.settingDescription}>{label.description}</Text>
              </View>
            </View>
            <Switch
              value={settings[key as keyof NotificationSettingsType] as boolean}
              onValueChange={(value) => onToggle(key, value)}
              trackColor={{ false: '#E0E0E0', true: '#64B5F6' }}
              thumbColor={settings[key as keyof NotificationSettingsType] ? '#42A5F5' : '#9E9E9E'}
              disabled={!settings.notification_enabled}
            />
          </View>
        ))}
      </View>

      {/* Settings Summary */}
      <View style={styles.summarySection}>
        <View style={styles.summaryContainer}>
          <Ionicons name="information-circle" size={20} color="#757575" />
          <Text style={styles.summaryText}>
            {notificationHelpers.getNotificationSummary(settings)}
          </Text>
        </View>
      </View>

      {/* Save Indicator */}
      {saving && (
        <View style={styles.savingContainer}>
          <ActivityIndicator size="small" color="#4CAF50" />
          <Text style={styles.savingText}>Saving changes...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#757575',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  iconContainer: {
    width: 40,
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 10,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: '#757575',
  },
  summarySection: {
    marginTop: 10,
    marginBottom: 20,
  },
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
  },
  summaryText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#757575',
    flex: 1,
  },
  savingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#E8F5E9',
    borderRadius: 4,
    marginTop: 10,
  },
  savingText: {
    marginLeft: 8,
    color: '#4CAF50',
    fontSize: 14,
  },
});