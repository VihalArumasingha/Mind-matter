import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { createReportApi } from '../../admin/services/adminService';

const REASONS = [
  'Harassment or bullying',
  'Hate speech',
  'Inappropriate content',
  'Spam or scam',
  'False or misleading information',
  'Other',
];

const ReportTargetButton = ({
  token,
  targetType,
  targetId,
  targetTitle,
  buttonLabel = 'Report',
}) => {
  const [visible, setVisible] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const submissionLocked = useRef(false);

  const openForm = () => {
    if (!submitted) {
      setReason('');
      setDetails('');
      setError('');
      setVisible(true);
    }
  };

  const submitReport = async () => {
    if (!reason || submissionLocked.current || submitted) return;

    try {
      submissionLocked.current = true;
      setIsSubmitting(true);
      setError('');
      await createReportApi(token, {
        targetType,
        targetId,
        targetTitle,
        reason,
        details: details.trim(),
      });
      setSubmitted(true);
    } catch (submitError) {
      submissionLocked.current = false;
      setError(
        submitError.message ||
          'Your report could not be submitted. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!targetId) return null;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          submitted
            ? 'Report submitted'
            : `${buttonLabel} ${targetType.toLowerCase()}`
        }
        onPress={openForm}
        disabled={submitted}
        style={({ pressed }) => [
          styles.trigger,
          pressed && styles.triggerPressed,
          submitted && styles.triggerSubmitted,
        ]}
      >
        <Text style={styles.triggerText}>
          {submitted ? 'Reported' : buttonLabel}
        </Text>
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.dialog}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.title}>
                Report {targetType.toLowerCase()}
              </Text>
              <Text style={styles.subtitle} numberOfLines={2}>
                {targetTitle}
              </Text>

              {submitted ? (
                <View style={styles.feedbackSuccess}>
                  <Text style={styles.successText}>
                    Thanks for letting us know. Your report has been submitted.
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={styles.label}>Why are you reporting this?</Text>
                  <View style={styles.reasons}>
                    {REASONS.map(option => (
                      <Pressable
                        key={option}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: reason === option }}
                        onPress={() => setReason(option)}
                        style={[
                          styles.reason,
                          reason === option && styles.reasonSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.reasonText,
                            reason === option && styles.reasonTextSelected,
                          ]}
                        >
                          {option}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <Text style={styles.label}>
                    Additional details (optional)
                  </Text>
                  <TextInput
                    value={details}
                    onChangeText={setDetails}
                    maxLength={1000}
                    multiline
                    textAlignVertical="top"
                    placeholder="Share any context that may help our team review this report."
                    placeholderTextColor="#899188"
                    style={styles.detailsInput}
                  />
                  {error ? (
                    <Text accessibilityRole="alert" style={styles.errorText}>
                      {error}
                    </Text>
                  ) : null}
                  <Pressable
                    onPress={submitReport}
                    disabled={!reason || isSubmitting}
                    style={[
                      styles.submitButton,
                      (!reason || isSubmitting) && styles.submitButtonDisabled,
                    ]}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.submitText}>Submit report</Text>
                    )}
                  </Pressable>
                </>
              )}

              <Pressable
                onPress={() => setVisible(false)}
                disabled={isSubmitting}
                style={styles.closeButton}
              >
                <Text style={styles.closeText}>
                  {submitted ? 'Done' : 'Cancel'}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 22,
    backgroundColor: 'rgba(15, 25, 17, 0.55)',
  },
  dialog: {
    maxHeight: '90%',
    padding: 22,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  title: { color: '#263526', fontSize: 21, fontWeight: '700' },
  subtitle: { color: '#657064', fontSize: 14, marginTop: 5, marginBottom: 20 },
  label: { color: '#344334', fontSize: 14, fontWeight: '600', marginBottom: 9 },
  reasons: { gap: 8, marginBottom: 18 },
  reason: {
    borderWidth: 1,
    borderColor: '#D9E2D7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  reasonSelected: { borderColor: '#397A49', backgroundColor: '#EDF6EB' },
  reasonText: { color: '#465346', fontSize: 14 },
  reasonTextSelected: { color: '#2F6B3D', fontWeight: '600' },
  detailsInput: {
    minHeight: 94,
    borderWidth: 1,
    borderColor: '#D9E2D7',
    borderRadius: 10,
    padding: 12,
    color: '#263526',
    fontSize: 14,
    marginBottom: 12,
  },
  submitButton: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: '#397A49',
    marginTop: 3,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  closeButton: { alignItems: 'center', paddingVertical: 13, marginTop: 3 },
  closeText: { color: '#526052', fontSize: 14, fontWeight: '600' },
  errorText: { color: '#B42318', fontSize: 13, marginBottom: 10 },
  feedbackSuccess: {
    padding: 13,
    backgroundColor: '#EDF6EB',
    borderRadius: 10,
  },
  successText: { color: '#2F6B3D', fontSize: 14, lineHeight: 20 },
  trigger: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  triggerPressed: { backgroundColor: '#EDF6EB' },
  triggerSubmitted: { opacity: 0.6 },
  triggerText: { color: '#397A49', fontSize: 12, fontWeight: '600' },
});

export default ReportTargetButton;
