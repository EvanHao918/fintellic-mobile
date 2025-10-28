import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Icon } from 'react-native-elements';
import { useNavigation, useRoute, useNavigationState } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../theme';

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  
  // ✅ Better detection: check if header is already provided by stack
  // If we can go back AND the route has params, we're likely from Login
  const canGoBack = navigation.canGoBack();
  const hasParams = route.params !== undefined;
  
  // Show custom header if we CAN go back (meaning we came from somewhere)
  // ProfileStack already provides header, so we check the route name
  const isProfileStackRoute = route.name === 'PrivacyPolicy';
  const shouldShowCustomHeader = canGoBack && !isProfileStackRoute;

  const renderSection = (title: string, content: string) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionContent}>{content}</Text>
    </View>
  );

  const renderDataTable = () => (
    <View style={styles.dataTable}>
      <Text style={styles.tableTitle}>Data We Collect</Text>
      
      <View style={styles.tableRow}>
        <Text style={styles.tableHeader}>Type</Text>
        <Text style={styles.tableHeader}>Purpose</Text>
        <Text style={styles.tableHeader}>Retention</Text>
      </View>
      
      <View style={styles.tableRow}>
        <Text style={styles.tableCell}>Account Info</Text>
        <Text style={styles.tableCell}>Service access</Text>
        <Text style={styles.tableCell}>Account lifetime</Text>
      </View>
      
      <View style={styles.tableRow}>
        <Text style={styles.tableCell}>Usage Data</Text>
        <Text style={styles.tableCell}>Improvement</Text>
        <Text style={styles.tableCell}>24 months</Text>
      </View>
      
      <View style={styles.tableRow}>
        <Text style={styles.tableCell}>Device Info</Text>
        <Text style={styles.tableCell}>Security</Text>
        <Text style={styles.tableCell}>12 months</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* ✅ Always show custom header when not in ProfileStack */}
      {shouldShowCustomHeader && (
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon
              name="arrow-back"
              type="material"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <View style={styles.headerRight} />
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        <View style={styles.lastUpdated}>
          <Text style={styles.lastUpdatedText}>Last Updated: December 2024</Text>
        </View>

        <View style={styles.introduction}>
          <Text style={styles.introText}>
            HermeSpeed is committed to protecting your privacy. This Privacy Policy explains 
            how we collect, use, and safeguard your personal information.
          </Text>
        </View>

        {renderSection(
          "1. Information We Collect",
          "We collect the following types of information:\n\n" +
          "Account Information:\n" +
          "• Email address\n" +
          "• Username\n" +
          "• Password (encrypted)\n\n" +
          "Usage Information:\n" +
          "• Filings you view\n" +
          "• Search queries\n" +
          "• Watchlist companies\n" +
          "• App usage patterns\n\n" +
          "Device Information:\n" +
          "• IP address\n" +
          "• Browser type\n" +
          "• Device type and OS\n" +
          "• App version\n\n" +
          "Payment Information:\n" +
          "• Processed by third-party providers (Stripe, Apple, Google)\n" +
          "• We do not store full credit card details"
        )}

        {renderSection(
          "2. How We Use Your Information",
          "We use your information to:\n\n" +
          "• Provide and maintain HermeSpeed services\n" +
          "• Process subscription payments\n" +
          "• Send filing notifications (if enabled)\n" +
          "• Improve our AI analysis quality\n" +
          "• Provide customer support\n" +
          "• Prevent fraud and abuse\n" +
          "• Comply with legal obligations\n\n" +
          "We do NOT:\n" +
          "• Sell your personal data to third parties\n" +
          "• Use your data for advertising\n" +
          "• Share your data with data brokers"
        )}

        {renderDataTable()}

        {renderSection(
          "3. Data Sharing",
          "We share your information only with:\n\n" +
          "Service Providers:\n" +
          "• Cloud hosting (AWS/Google Cloud)\n" +
          "• Payment processors (Stripe, Apple, Google)\n" +
          "• Email delivery services\n" +
          "• Analytics providers (anonymized data)\n\n" +
          "Legal Requirements:\n" +
          "• When required by law\n" +
          "• To protect our rights or safety\n" +
          "• In connection with legal proceedings\n\n" +
          "Business Transfers:\n" +
          "• In case of merger or acquisition\n\n" +
          "We do NOT sell your personal information to third parties."
        )}

        {renderSection(
          "4. Data Security",
          "We implement industry-standard security measures:\n\n" +
          "• Encryption in transit (HTTPS/TLS)\n" +
          "• Encryption at rest for sensitive data\n" +
          "• Secure password hashing\n" +
          "• Regular security assessments\n" +
          "• Limited employee access to data\n\n" +
          "However, no method of transmission or storage is 100% secure. We cannot guarantee absolute security."
        )}

        {renderSection(
          "5. Your Rights",
          "You have the right to:\n\n" +
          "• Access your personal data\n" +
          "• Correct inaccurate information\n" +
          "• Delete your account and data\n" +
          "• Export your data\n" +
          "• Opt out of marketing emails\n" +
          "• Withdraw consent for data processing\n\n" +
          "To exercise these rights, contact us at privacy@hermespeed.com"
        )}

        {renderSection(
          "6. Data Retention",
          "We retain your data as follows:\n\n" +
          "• Account data: Until you delete your account\n" +
          "• Usage data: 24 months\n" +
          "• Device data: 12 months\n" +
          "• Payment records: 7 years (tax requirements)\n\n" +
          "After account deletion, we may retain some data for:\n" +
          "• Legal compliance\n" +
          "• Fraud prevention\n" +
          "• Resolving disputes"
        )}

        {renderSection(
          "7. Cookies and Tracking",
          "We use cookies and similar technologies for:\n\n" +
          "• Remembering your login\n" +
          "• Saving preferences\n" +
          "• Analyzing usage patterns\n" +
          "• Improving performance\n\n" +
          "You can control cookies through your browser settings. Disabling cookies may affect functionality."
        )}

        {renderSection(
          "8. Third-Party Services",
          "Our platform integrates with:\n\n" +
          "• Stripe, Apple Pay, Google Pay (payments)\n" +
          "• Cloud hosting providers\n" +
          "• Email services\n\n" +
          "These services have their own privacy policies. We recommend reviewing them."
        )}

        {renderSection(
          "9. International Transfers",
          "Your information may be processed in countries outside your own. We ensure adequate protection through:\n\n" +
          "• Standard contractual clauses\n" +
          "• Adequacy decisions\n" +
          "• Additional safeguards as required"
        )}

        {renderSection(
          "10. Children's Privacy",
          "HermeSpeed is not intended for users under 18. We do not knowingly collect data from children. If we discover we have collected such data, we will delete it promptly."
        )}

        {renderSection(
          "11. California Privacy Rights (CCPA)",
          "California residents have additional rights:\n\n" +
          "• Right to know what data is collected\n" +
          "• Right to delete personal data\n" +
          "• Right to opt-out of data sales (we don't sell data)\n" +
          "• Right to non-discrimination\n\n" +
          "Contact us at privacy@hermespeed.com to exercise these rights."
        )}

        {renderSection(
          "12. European Privacy Rights (GDPR)",
          "If you're in the EU/EEA, you have rights under GDPR:\n\n" +
          "• Lawful basis for processing: Legitimate interest and contract\n" +
          "• Right to lodge complaints with supervisory authorities\n" +
          "• Data portability rights\n" +
          "• Right to object to processing\n\n" +
          "Contact us at privacy@hermespeed.com for assistance."
        )}

        {renderSection(
          "13. Changes to This Policy",
          "We may update this Privacy Policy. Material changes will be notified via email or through the platform. Continued use after changes constitutes acceptance."
        )}

        {renderSection(
          "14. Contact Us",
          "For privacy questions or to exercise your rights:\n\n" +
          "Privacy Team: privacy@hermespeed.com\n" +
          "Support: support@hermespeed.com\n\n" +
          "Legal Entity: [Legal Entity Name]\n" +
          "Address: [To be determined]"
        )}

        <View style={styles.commitment}>
          <View style={styles.commitmentBox}>
            <Icon name="security" type="material" size={24} color={colors.success} />
            <View style={styles.commitmentText}>
              <Text style={styles.commitmentTitle}>Our Privacy Commitment</Text>
              <Text style={styles.commitmentDescription}>
                We are committed to transparency and giving you control over your data. 
                We will never sell your personal information to third parties.
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    paddingTop: Platform.OS === 'ios' ? spacing.xl + spacing.md : spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  lastUpdated: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  lastUpdatedText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  introduction: {
    backgroundColor: colors.primary + '10',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
  },
  introText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    lineHeight: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  sectionContent: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    lineHeight: 24,
    textAlign: 'justify',
  },
  dataTable: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.lg,
    overflow: 'hidden',
  },
  tableTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    backgroundColor: colors.gray50,
    padding: spacing.md,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableHeader: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    backgroundColor: colors.gray100,
    padding: spacing.sm,
    textAlign: 'center',
  },
  tableCell: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text,
    padding: spacing.sm,
    textAlign: 'center',
  },
  commitment: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  commitmentBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.success + '10',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  commitmentText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  commitmentTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  commitmentDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
});