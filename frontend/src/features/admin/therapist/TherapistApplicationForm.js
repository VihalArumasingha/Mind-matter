import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, StyleSheet, BackHandler,
  StatusBar, Platform
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { pick, types, isErrorWithCode, errorCodes } from '@react-native-documents/picker';
import { submitTherapistApplicationWithFiles } from '../../admin/services/adminService';
import { PROFESSION_CATEGORIES } from '../../../config/professions';
import { useAuth } from '../../../context/AuthContext';

const COLORS = {
  primary: '#0D9488',
  primaryLight: '#CCFBF1',
  bg: '#F0FDFA',
  card: '#FFFFFF',
  surface: '#F1F5F9',
  border: '#CBD5E1',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  success: '#059669',
  successBg: '#ECFDF5',
  danger: '#DC2626',
  dangerBg: '#FEF2F2',
  info: '#2563EB',
  infoBg: '#EFF6FF',
};

const DOC_TYPES = [
  { key: 'license', label: 'State License Certificate', desc: 'Official state board license (PDF)', required: true },
  { key: 'degree', label: 'Degree / Diploma', desc: 'University degree transcript (PDF)', required: false },
  { key: 'id', label: 'Government ID', desc: 'National/State ID or Passport (PDF/JPG)', required: false },
  { key: 'references', label: 'Professional References', desc: 'Reference letter (PDF/DOC)', required: false },
];

const FormField = ({ label, required, children }) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.fieldLabel}>
      {label}
      {required && <Text style={styles.requiredStar}> *</Text>}
    </Text>
    {children}
  </View>
);

const StepBar = ({ step }) => (
  <View>
    <View style={styles.stepBar}>
      {[1, 2].map((s) => (
        <React.Fragment key={s}>
          <View style={[styles.stepDot, step >= s && styles.stepDotActive]}>
            <Text style={[styles.stepDotText, step >= s && styles.stepDotTextActive]}>{s}</Text>
          </View>
          {s < 2 && <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />}
        </React.Fragment>
      ))}
    </View>
    <View style={styles.stepLabelRow}>
      <Text style={[styles.stepLabelText, step === 1 && styles.stepLabelActive]}>Personal Info</Text>
      <View style={{ flex: 1 }} />
      <Text style={[styles.stepLabelText, step === 2 && styles.stepLabelActive]}>Upload Docs</Text>
    </View>
  </View>
);

const TherapistApplicationForm = ({ onSubmitted, onClose, userId, applicationType = 'professional' }) => {
  const isOrganizerApplication = applicationType === 'organizer';
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profession, setProfession] = useState(isOrganizerApplication ? 'Community Organizer' : PROFESSION_CATEGORIES[0]);
  const [licenseNum, setLicenseNum] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [expYears, setExpYears] = useState('5');
  const [bio, setBio] = useState('');
  const [uploadedDocs, setUploadedDocs] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [step, setStep] = useState(1);
  const [pickingDoc, setPickingDoc] = useState(null);



  useEffect(() => {
    const onBackPress = () => {
      if (step === 2) {
        setStep(1);
        return true;
      }
      if (onClose) {
        onClose();
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [step, onClose]);

  const handlePickDoc = async (docKey) => {
    setPickingDoc(docKey);
    try {
      const [result] = await pick({
        type: [types.pdf, types.images, types.docx, types.plainText],
        copyTo: 'cachesDirectory',
      });

      setUploadedDocs((prev) => ({
        ...prev,
        [docKey]: {
          title: result.name || `${docKey}_document`,
          url: result.fileCopyUri || result.uri || '',
          uri: result.uri,
          type: docKey,
          fileName: result.name || '',
          mimeType: result.type || 'application/pdf',
          size: result.size || 0,
          uploadedAt: new Date().toLocaleTimeString(),
        },
      }));
    } catch (err) {
      if (isErrorWithCode(err, errorCodes.OPERATION_CANCELED)) {
      } else {
        Alert.alert('File Pick Error', err.message || 'Could not open file picker.');
      }
    } finally {
      setPickingDoc(null);
    }
  };

  const removeDoc = (docKey) => {
    setUploadedDocs((prev) => {
      const updated = { ...prev };
      delete updated[docKey];
      return updated;
    });
  };

  const goToStep2 = () => {
    if (!fullName.trim() || !email.trim() || !licenseNum.trim()) {
      Alert.alert('Required Fields', 'Please fill Full Name, Email, and License or reference number.');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!uploadedDocs.license) {
      Alert.alert('Missing Document', `${isOrganizerApplication ? 'CV or resume' : 'State License Certificate'} is required to submit your application.`);
      return;
    }
    setSubmitting(true);
    try {
      const formData = {
        fullName: fullName.trim(),
        email: email.trim(), // Save the form email as-is in the application
        phone: phone.trim(),
        profession: profession,
        licenseNum: licenseNum.trim(),
        specialization: specialization.trim() || 'General Mental Health Support',
        expYears: parseInt(expYears, 10) || 1,
        bio: bio.trim(),
        userId: userId || user?._id || '', // Use logged-in user's ID for account linking
        userEmail: user?.email || '', // Use logged-in user's email for account linking
        user: user, // Pass the entire user object
        documents: Object.values(uploadedDocs).map((doc) => ({
          uri: doc.uri,
          type: doc.mimeType || 'application/pdf',
          name: doc.fileName || 'document.pdf',
        })),
      };

      console.log('Submitting application - Form email:', email.trim(), 'Account email:', user?.email);

      const data = await submitTherapistApplicationWithFiles(formData);
      console.log('Response:', data);

      setSubmittedSuccess(true);
      if (onSubmitted) onSubmitted();
    } catch (err) {
      console.error('Error:', err);
      Alert.alert('Submission Error', err.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedSuccess) {
    return (
      <View style={[styles.successContainer, { paddingTop: insets.top + 10 }]}>
        <View style={styles.successIconRing}>
          <Text style={styles.successIcon}>✓</Text>
        </View>
        <Text style={styles.successTitle}>Application Submitted!</Text>
        <Text style={styles.successDesc}>
<<<<<<< HEAD
          Thank you for applying to become a {isOrganizerApplication ? 'community organizer' : 'verified therapist'} on MindMatter. Administrators
          will review your credentials and documents shortly.
=======
          Thank you for applying to be a verified therapist on MindMatter. Administrators
          will review your credentials and license documents shortly. Once approved, you'll be able
          to login with your account email and password to access the volunteer dashboard.
>>>>>>> origin/main
        </Text>
        <View style={styles.successInfoBox}>
          <Text style={styles.successInfoText}>📄 {Object.keys(uploadedDocs).length} document(s) attached</Text>
          <Text style={styles.successInfoText}>Typical review: 2–5 business days</Text>
        </View>
        <TouchableOpacity
          style={styles.successBtn}
          onPress={() => { setSubmittedSuccess(false); if (onClose) onClose(); }}
        >
          <Text style={styles.successBtnText}>Return to App</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderStep1 = () => (
    <View>
      <FormField label="Full Legal Name" required>
        <TextInput
          style={[styles.input, focusedField === 'name' && styles.inputFocused]}
          placeholder="e.g. Dr. Sarah Connor"
          placeholderTextColor={COLORS.textMuted}
          value={fullName}
          onChangeText={setFullName}
          onFocus={() => setFocusedField('name')}
          onBlur={() => setFocusedField(null)}
        />
      </FormField>

      <FormField label="Professional Email" required>
        <TextInput
          style={[styles.input, focusedField === 'email' && styles.inputFocused]}
          placeholder="e.g. sarah.c@psychology.org"
          placeholderTextColor={COLORS.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          onFocus={() => setFocusedField('email')}
          onBlur={() => setFocusedField(null)}
        />
      </FormField>

      <FormField label="Phone Number">
        <TextInput
          style={[styles.input, focusedField === 'phone' && styles.inputFocused]}
          placeholder="e.g. 077 482 23 11"
          placeholderTextColor={COLORS.textMuted}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          onFocus={() => setFocusedField('phone')}
          onBlur={() => setFocusedField(null)}
        />
      </FormField>

      {!isOrganizerApplication && <FormField label="Profession Category" required>
        <View style={styles.chipsWrap}>
          {PROFESSION_CATEGORIES.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.chip, profession === p && styles.chipActive]}
              onPress={() => setProfession(p)}
            >
              <Text style={[styles.chipText, profession === p && styles.chipTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </FormField>}

      <FormField label={isOrganizerApplication ? 'Professional Reference Number' : 'State License Number'} required>
        <TextInput
          style={[styles.input, focusedField === 'license' && styles.inputFocused]}
          placeholder={isOrganizerApplication ? 'e.g. ORG-2026-001' : 'e.g. PSY-99201-CA'}
          placeholderTextColor={COLORS.textMuted}
          autoCapitalize="characters"
          value={licenseNum}
          onChangeText={setLicenseNum}
          onFocus={() => setFocusedField('license')}
          onBlur={() => setFocusedField(null)}
        />
      </FormField>

      <FormField label="Specializations & Therapeutic Focus">
        <TextInput
          style={[styles.input, focusedField === 'spec' && styles.inputFocused]}
          placeholder="e.g. CBT, Trauma Recovery, Adolescent Anxiety"
          placeholderTextColor={COLORS.textMuted}
          value={specialization}
          onChangeText={setSpecialization}
          onFocus={() => setFocusedField('spec')}
          onBlur={() => setFocusedField(null)}
        />
      </FormField>

      <FormField label="Years of Clinical Experience">
        <TextInput
          style={[styles.input, focusedField === 'exp' && styles.inputFocused]}
          placeholder="e.g. 5"
          placeholderTextColor={COLORS.textMuted}
          keyboardType="numeric"
          value={expYears}
          onChangeText={setExpYears}
          onFocus={() => setFocusedField('exp')}
          onBlur={() => setFocusedField(null)}
        />
      </FormField>

      <FormField label="Professional Bio & Background">
        <TextInput
          style={[styles.input, styles.textarea, focusedField === 'bio' && styles.inputFocused]}
          placeholder="Describe your clinical background, methodology, and what drives your practice..."
          placeholderTextColor={COLORS.textMuted}
          multiline
          textAlignVertical="top"
          value={bio}
          onChangeText={setBio}
          onFocus={() => setFocusedField('bio')}
          onBlur={() => setFocusedField(null)}
        />
      </FormField>

      <TouchableOpacity style={styles.primaryBtn} onPress={goToStep2}>
        <Text style={styles.primaryBtnText}>Continue to Documents →</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => {
    const docCount = Object.keys(uploadedDocs).length;
    return (
      <View>
        <View style={styles.docInfoBanner}>
          <Text style={styles.docInfoTitle}> Credential Document Upload</Text>
          <Text style={styles.docInfoDesc}>
            Tap "Choose File" to select documents from your phone. Files are encrypted and
            reviewed only by verified MindMatter administrators. {isOrganizerApplication ? 'CV or resume is required.' : 'License Certificate is required.'}
          </Text>
        </View>

        {DOC_TYPES.map((doc) => {
          const uploaded = uploadedDocs[doc.key];
          const isPicking = pickingDoc === doc.key;
          return (
            <View key={doc.key} style={[styles.docRow, uploaded && styles.docRowUploaded]}>
              <View style={styles.docRowLeft}>
                <Text style={styles.docRowLabel}>
                  {isOrganizerApplication && doc.key === 'license' ? 'CV / Resume' : doc.label}
                  {doc.required && <Text style={styles.requiredStar}> *</Text>}
                </Text>
                <Text style={styles.docRowDesc}>{doc.desc}</Text>

                {uploaded ? (
                  <View style={styles.uploadedInfo}>
                    <Text style={styles.uploadedFileName} numberOfLines={1}>✓ {uploaded.fileName}</Text>
                    {uploaded.size > 0 && (
                      <Text style={styles.uploadedMeta}>
                        {(uploaded.size / 1024).toFixed(1)} KB · {uploaded.mimeType?.split('/')[1]?.toUpperCase() || 'FILE'} · {uploaded.uploadedAt}
                      </Text>
                    )}
                  </View>
                ) : null}
              </View>

              <View style={styles.docRowActions}>
                {uploaded ? (
                  <>
                    <TouchableOpacity
                      style={styles.replaceBtn}
                      onPress={() => handlePickDoc(doc.key)}
                      disabled={isPicking}
                    >
                      <Text style={styles.replaceBtnText}>{isPicking ? '...' : '↺ Replace'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.removeDocBtn} onPress={() => removeDoc(doc.key)}>
                      <Text style={styles.removeDocBtnText}>✕</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={[styles.uploadBtn, isPicking && styles.btnDisabled]}
                    onPress={() => handlePickDoc(doc.key)}
                    disabled={isPicking}
                  >
                    {isPicking
                      ? <ActivityIndicator color="#FFF" size="small" />
                      : <Text style={styles.uploadBtnText}>Choose File</Text>
                    }
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}

        <View style={styles.docSummaryBox}>
          <Text style={styles.docSummaryText}>
            {docCount} of {DOC_TYPES.length} documents attached
            {!uploadedDocs.license && <Text style={styles.docSummaryWarn}> — {isOrganizerApplication ? 'CV required' : 'License required'}</Text>}
          </Text>
          <View style={styles.docProgressTrack}>
            <View style={[styles.docProgressFill, { width: `${(docCount / DOC_TYPES.length) * 100}%` }]} />
          </View>
        </View>

        <View style={styles.rowBtns}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep(1)}>
            <Text style={styles.secondaryBtnText}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryBtn, { flex: 1, marginLeft: 10 }, submitting && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting
              ? <ActivityIndicator color="#FFF" />
              : <Text style={styles.primaryBtnText}>Submit Application ✓</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Professional Application</Text>
          <Text style={styles.headerSubtitle}>
            Apply to provide verified peer-support counseling and therapeutic sessions.
          </Text>
        </View>

        {/* Step Indicator */}
        <StepBar step={step} />

        {/* Form Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderText}>
              {step === 1 ? 'Personal & Professional Details' : 'Credential Documents'}
            </Text>
          </View>
          <View style={styles.cardBody}>
            {step === 1 ? renderStep1() : renderStep2()}
          </View>
        </View>

        {/* Privacy */}
        <View style={styles.privacyRow}>
          <Text style={styles.privacyText}>
            Your information and documents are encrypted and handled per our{' '}
            <Text style={styles.privacyLink}>Privacy Policy</Text>.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  contentContainer: { 
    paddingHorizontal: 16, 
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 4 : 4,
    paddingBottom: 40 
  },

  header: { marginBottom: 16 },
  headerBadge: {
    alignSelf: 'flex-start', backgroundColor: COLORS.primaryLight,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8,
  },
  headerBadgeText: { color: COLORS.primary, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  headerTitle: { color: COLORS.textPrimary, fontSize: 24, fontWeight: '800', marginBottom: 4 },
  headerSubtitle: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 },

  stepBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, paddingHorizontal: 4 },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.surface, borderWidth: 2,
    borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  stepDotText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '700' },
  stepDotTextActive: { color: '#FFF' },
  stepLine: { flex: 1, height: 2, backgroundColor: COLORS.border, marginHorizontal: 6 },
  stepLineActive: { backgroundColor: COLORS.primary },
  stepLabelRow: { flexDirection: 'row', marginBottom: 16, paddingHorizontal: 4 },
  stepLabelText: { color: COLORS.textMuted, fontSize: 11, fontWeight: '600' },
  stepLabelActive: { color: COLORS.primary },

  card: {
    backgroundColor: COLORS.card, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 14,
    overflow: 'hidden', shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  cardHeader: {
    backgroundColor: COLORS.surface, paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  cardHeaderText: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '700' },
  cardBody: { padding: 16 },

  fieldGroup: { marginBottom: 16 },
  fieldLabel: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 6, letterSpacing: 0.3 },
  requiredStar: { color: COLORS.danger },
  input: {
    backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    color: COLORS.textPrimary, fontSize: 13,
  },
  inputFocused: { borderColor: COLORS.primary, backgroundColor: '#F0FDFA' },
  textarea: { height: 90, textAlignVertical: 'top' },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border,
    marginRight: 8, marginBottom: 8,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#FFF' },

  primaryBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', justifyContent: 'center', marginTop: 8,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  primaryBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },
  secondaryBtn: {
    backgroundColor: COLORS.surface, borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 20,
    alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border, marginTop: 8,
  },
  secondaryBtnText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },
  rowBtns: { flexDirection: 'row', alignItems: 'center' },

  docInfoBanner: {
    backgroundColor: COLORS.infoBg, borderRadius: 12, padding: 14,
    marginBottom: 16, borderLeftWidth: 4, borderLeftColor: COLORS.info,
  },
  docInfoTitle: { color: COLORS.info, fontSize: 13, fontWeight: '700', marginBottom: 4 },
  docInfoDesc: { color: '#1E40AF', fontSize: 12, lineHeight: 18 },

  docRow: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 14,
    marginBottom: 10, borderWidth: 1.5, borderColor: COLORS.border,
  },
  docRowUploaded: { borderColor: COLORS.primary, backgroundColor: '#F0FDFA' },
  docRowLeft: { flex: 1, marginRight: 10 },
  docRowLabel: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: 2 },
  docRowDesc: { color: COLORS.textMuted, fontSize: 11, lineHeight: 16 },
  uploadedInfo: { marginTop: 6 },
  uploadedFileName: { color: COLORS.success, fontSize: 12, fontWeight: '600' },
  uploadedMeta: { color: COLORS.textMuted, fontSize: 10, marginTop: 2 },

  docRowActions: { alignItems: 'flex-end', justifyContent: 'flex-start', gap: 6 },
  uploadBtn: {
    backgroundColor: COLORS.primary, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 9, minWidth: 90, alignItems: 'center',
  },
  uploadBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  replaceBtn: {
    backgroundColor: COLORS.surface, borderRadius: 8, borderWidth: 1,
    borderColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center',
  },
  replaceBtnText: { color: COLORS.primary, fontSize: 11, fontWeight: '700' },
  removeDocBtn: {
    backgroundColor: COLORS.dangerBg, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: '#FECACA', alignItems: 'center',
  },
  removeDocBtnText: { color: COLORS.danger, fontSize: 13, fontWeight: '700' },

  docSummaryBox: { backgroundColor: COLORS.surface, borderRadius: 10, padding: 12, marginBottom: 14 },
  docSummaryText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8 },
  docSummaryWarn: { color: COLORS.danger },
  docProgressTrack: { height: 6, backgroundColor: COLORS.border, borderRadius: 4 },
  docProgressFill: { height: 6, backgroundColor: COLORS.primary, borderRadius: 4 },

  privacyRow: { alignItems: 'center', paddingBottom: 10 },
  privacyText: { color: COLORS.textMuted, fontSize: 11, textAlign: 'center', lineHeight: 16 },
  privacyLink: { color: COLORS.primary, fontWeight: '600' },

  successContainer: {
    flex: 1, backgroundColor: COLORS.bg, padding: 24,
    justifyContent: 'center', alignItems: 'center',
  },
  successIconRing: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.successBg,
    borderWidth: 3, borderColor: COLORS.success,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  successIcon: { fontSize: 36, color: COLORS.success, fontWeight: 'bold' },
  successTitle: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
  successDesc: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  successInfoBox: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, width: '100%', marginBottom: 24 },
  successInfoText: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 6 },
  successBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 40,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  successBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});

export default TherapistApplicationForm;