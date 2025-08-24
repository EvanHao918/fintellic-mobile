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

type TermsScreenNavigationProp = StackNavigationProp<any, 'TermsOfService'>;

export default function TermsScreen() {
  const navigation = useNavigation<TermsScreenNavigationProp>();

  const renderSection = (title: string, content: string) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionContent}>{content}</Text>
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
        <Text style={styles.headerTitle}>Terms of Service</Text>
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
            Welcome to HermeSpeed. These Terms of Service ("Terms") govern your use of our 
            AI-powered financial intelligence platform. By accessing or using HermeSpeed, 
            you agree to be bound by these Terms.
          </Text>
        </View>

        {/* Terms Sections */}
        {renderSection(
          "1. Service Description",
          "HermeSpeed provides AI-powered analysis of SEC filings including 10-K, 10-Q, 8-K, and S-1 documents. Our service offers intelligent summaries, insights, and financial intelligence to help users make informed investment decisions."
        )}

        {renderSection(
          "2. User Accounts and Registration",
          "To access certain features of HermeSpeed, you must create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate and complete information during registration."
        )}

        {renderSection(
          "3. Subscription Plans and Billing",
          "HermeSpeed offers both free and premium subscription plans:\n\n" +
          "• Free Plan: Limited to 2 filing views per day\n" +
          "• Pro Plan: Unlimited access to all features\n" +
          "• Early Bird Pricing: First 10,000 users receive permanent pricing at $39/month\n\n" +
          "Subscriptions are billed monthly or annually. You may cancel your subscription at any time through your account settings."
        )}

        {renderSection(
          "4. Acceptable Use Policy",
          "You agree not to:\n\n" +
          "• Use the service for any illegal or unauthorized purpose\n" +
          "• Attempt to gain unauthorized access to our systems\n" +
          "• Share your account credentials with others\n" +
          "• Use automated tools to access our service without permission\n" +
          "• Distribute or commercialize content obtained from our platform"
        )}

        {renderSection(
          "5. Intellectual Property Rights",
          "HermeSpeed and its content, features, and functionality are owned by our company and are protected by international copyright, trademark, and other intellectual property laws. Our AI-generated analysis and summaries are proprietary to HermeSpeed."
        )}

        {renderSection(
          "6. Financial Disclaimer",
          "IMPORTANT: HermeSpeed provides information and analysis for educational purposes only. Our content does not constitute financial advice, investment recommendations, or trading signals. You should consult with qualified financial professionals before making investment decisions. Past performance does not guarantee future results."
        )}

        {renderSection(
          "7. Data Accuracy and Limitations",
          "While we strive to provide accurate and timely information, HermeSpeed does not guarantee the accuracy, completeness, or timeliness of any data or analysis. SEC filing data is sourced from public records and processed through our AI systems. Users should verify information independently."
        )}

        {renderSection(
          "8. Privacy and Data Protection",
          "Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your personal information. By using HermeSpeed, you consent to our data practices as described in our Privacy Policy."
        )}

        {renderSection(
          "9. Limitation of Liability",
          "TO THE MAXIMUM EXTENT PERMITTED BY LAW, HERMESPEED SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR USE, ARISING OUT OF YOUR USE OF THE SERVICE."
        )}

        {renderSection(
          "10. Termination",
          "We reserve the right to suspend or terminate your account at any time for violation of these Terms or for any other reason at our sole discretion. Upon termination, your right to use the service will cease immediately."
        )}

        {renderSection(
          "11. Changes to Terms",
          "We may update these Terms from time to time. We will notify users of material changes via email or through the service. Your continued use of HermeSpeed after such modifications constitutes acceptance of the updated Terms."
        )}

        {renderSection(
          "12. Governing Law and Dispute Resolution",
          "These Terms are governed by the laws of [Jurisdiction]. Any disputes arising from these Terms or your use of HermeSpeed will be resolved through binding arbitration in accordance with the rules of [Arbitration Organization]."
        )}

        {renderSection(
          "13. Contact Information",
          "If you have questions about these Terms, please contact us at:\n\n" +
          "Email: legal@hermespeed.com\n" +
          "Address: [Company Address]\n\n" +
          "For technical support, please contact: support@hermespeed.com"
        )}

        {/* Agreement Section */}
        <View style={styles.agreement}>
          <View style={styles.agreementBox}>
            <Icon name="info" type="material" size={20} color={colors.primary} />
            <Text style={styles.agreementText}>
              By using HermeSpeed, you acknowledge that you have read, understood, 
              and agree to be bound by these Terms of Service.
            </Text>
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
    backgroundColor: colors.primaryLight + '10',
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
  agreement: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  agreementBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primary + '10',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  agreementText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text,
    lineHeight: 20,
    marginLeft: spacing.sm,
    fontWeight: typography.fontWeight.medium,
  },
});