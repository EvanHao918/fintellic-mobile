import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { colors, typography, spacing, borderRadius } from '../theme';

type PrivacyPolicyScreenNavigationProp = StackNavigationProp<any, 'PrivacyPolicy'>;

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation<PrivacyPolicyScreenNavigationProp>();

  const renderSection = (title: string, content: string) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionContent}>{content}</Text>
    </View>
  );

  const renderDataTable = () => (
    <View style={styles.dataTable}>
      <Text style={styles.tableTitle}>Types of Data We Collect</Text>
      
      <View style={styles.tableRow}>
        <Text style={styles.tableHeader}>Data Type</Text>
        <Text style={styles.tableHeader}>Purpose</Text>
        <Text style={styles.tableHeader}>Retention</Text>
      </View>
      
      <View style={styles.tableRow}>
        <Text style={styles.tableCell}>Account Info</Text>
        <Text style={styles.tableCell}>Service provision</Text>
        <Text style={styles.tableCell}>Account lifetime</Text>
      </View>
      
      <View style={styles.tableRow}>
        <Text style={styles.tableCell}>Usage Data</Text>
        <Text style={styles.tableCell}>Service improvement</Text>
        <Text style={styles.tableCell}>24 months</Text>
      </View>
      
      <View style={styles.tableRow}>
        <Text style={styles.tableCell}>Device Info</Text>
        <Text style={styles.tableCell}>Security & support</Text>
        <Text style={styles.tableCell}>12 months</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" type="material" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Last Updated */}
        <View style={styles.lastUpdated}>
          <Text style={styles.lastUpdatedText}>Last Updated: August 22, 2025</Text>
        </View>

        {/* Introduction */}
        <View style={styles.introduction}>
          <Text style={styles.introText}>
            At HermeSpeed, we are committed to protecting your privacy and ensuring the 
            security of your personal information. This Privacy Policy explains how we 
            collect, use, and safeguard your data when you use our financial intelligence platform.
          </Text>
        </View>

        {/* Privacy Sections */}
        {renderSection(
          "1. Information We Collect",
          "We collect information you provide directly to us, such as:\n\n" +
          "• Account Information: Name, email address, username, and password\n" +
          "• Profile Data: Preferences, subscription details, and account settings\n" +
          "• Usage Data: How you interact with our platform, viewed filings, search queries\n" +
          "• Device Information: IP address, browser type, operating system, device identifiers\n" +
          "• Communication Data: Support inquiries, feedback, and correspondence"
        )}

        {renderSection(
          "2. How We Use Your Information",
          "We use your information to:\n\n" +
          "• Provide and maintain our services\n" +
          "• Process your subscription and payments\n" +
          "• Send you relevant notifications about filings and market updates\n" +
          "• Improve our AI analysis and platform features\n" +
          "• Provide customer support and respond to inquiries\n" +
          "• Ensure platform security and prevent fraud\n" +
          "• Comply with legal obligations and enforce our Terms of Service"
        )}

        {/* Data Collection Table */}
        {renderDataTable()}

        {renderSection(
          "3. Information Sharing and Disclosure",
          "We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:\n\n" +
          "• Service Providers: With trusted third-party vendors who assist in operating our platform\n" +
          "• Legal Requirements: When required by law, court order, or government regulation\n" +
          "• Business Transfers: In connection with a merger, acquisition, or sale of assets\n" +
          "• Safety and Security: To protect our users and platform from harm or illegal activity"
        )}

        {renderSection(
          "4. Data Security Measures",
          "We implement industry-standard security measures to protect your information:\n\n" +
          "• Encryption: All data is encrypted in transit and at rest\n" +
          "• Access Controls: Strict employee access controls and authentication\n" +
          "• Regular Audits: Security assessments and vulnerability testing\n" +
          "• Secure Infrastructure: Cloud hosting with enterprise-grade security\n" +
          "• Incident Response: Comprehensive data breach response procedures"
        )}

        {renderSection(
          "5. Your Privacy Rights",
          "Depending on your location, you may have the following rights:\n\n" +
          "• Access: Request a copy of your personal data\n" +
          "• Correction: Update or correct inaccurate information\n" +
          "• Deletion: Request deletion of your personal data\n" +
          "• Portability: Receive your data in a portable format\n" +
          "• Opt-out: Unsubscribe from marketing communications\n" +
          "• Restriction: Limit how we process your data"
        )}

        {renderSection(
          "6. Cookies and Tracking Technologies",
          "We use cookies and similar technologies to:\n\n" +
          "• Remember your preferences and login status\n" +
          "• Analyze platform usage and performance\n" +
          "• Personalize your experience and content\n" +
          "• Provide relevant notifications and updates\n\n" +
          "You can control cookies through your browser settings, but some features may not function properly if cookies are disabled."
        )}

        {renderSection(
          "7. International Data Transfers",
          "Your information may be transferred to and processed in countries other than your own. We ensure adequate protection through:\n\n" +
          "• Standard Contractual Clauses for EU data transfers\n" +
          "• Adequacy decisions for approved jurisdictions\n" +
          "• Additional safeguards for sensitive data transfers"
        )}

        {renderSection(
          "8. Data Retention",
          "We retain your information for as long as necessary to:\n\n" +
          "• Provide our services to you\n" +
          "• Comply with legal obligations\n" +
          "• Resolve disputes and enforce agreements\n" +
          "• Improve our services and AI algorithms\n\n" +
          "Account data is typically retained for the duration of your account plus 3 years. Usage data is retained for 24 months."
        )}

        {renderSection(
          "9. Children's Privacy",
          "HermeSpeed is not intended for users under 18 years of age. We do not knowingly collect personal information from children under 18. If we become aware that we have collected such information, we will take steps to delete it promptly."
        )}

        {renderSection(
          "10. Third-Party Services",
          "Our platform may integrate with third-party services such as:\n\n" +
          "• Payment processors (Apple Pay, Google Pay, Stripe)\n" +
          "• Analytics providers (anonymized usage data)\n" +
          "• Customer support tools\n" +
          "• Email delivery services\n\n" +
          "These services have their own privacy policies governing the use of your information."
        )}

        {renderSection(
          "11. California Privacy Rights (CCPA)",
          "California residents have additional rights under the California Consumer Privacy Act:\n\n" +
          "• Right to know what personal information is collected\n" +
          "• Right to delete personal information\n" +
          "• Right to opt-out of the sale of personal information\n" +
          "• Right to non-discrimination for exercising CCPA rights\n\n" +
          "Note: We do not sell personal information to third parties."
        )}

        {renderSection(
          "12. European Privacy Rights (GDPR)",
          "If you are in the European Economic Area, you have rights under the General Data Protection Regulation:\n\n" +
          "• Lawful basis for processing (legitimate interest, consent, contract)\n" +
          "• Data Protection Officer contact: dpo@hermespeed.com\n" +
          "• Right to lodge complaints with supervisory authorities\n" +
          "• Data processing transparency and accountability"
        )}

        {renderSection(
          "13. Changes to This Privacy Policy",
          "We may update this Privacy Policy periodically to reflect changes in our practices or applicable laws. We will notify you of material changes via email or through the platform. Your continued use of HermeSpeed after such changes constitutes acceptance of the updated policy."
        )}

        {renderSection(
          "14. Contact Information",
          "If you have questions about this Privacy Policy or our data practices, please contact us:\n\n" +
          "Privacy Team: privacy@hermespeed.com\n" +
          "Data Protection Officer: dpo@hermespeed.com\n" +
          "General Support: support@hermespeed.com\n\n" +
          "Mailing Address:\n[Company Name]\n[Address Line 1]\n[City, State, ZIP]\n[Country]"
        )}

        {/* Privacy Commitment */}
        <View style={styles.commitment}>
          <View style={styles.commitmentBox}>
            <Icon name="security" type="material" size={24} color={colors.success} />
            <View style={styles.commitmentText}>
              <Text style={styles.commitmentTitle}>Our Privacy Commitment</Text>
              <Text style={styles.commitmentDescription}>
                We are committed to transparency, security, and giving you control over your personal information. 
                Your trust is essential to our mission of providing intelligent financial insights.
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
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
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
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