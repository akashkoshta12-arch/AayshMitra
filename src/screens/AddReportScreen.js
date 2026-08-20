import React, { useState } from 'react';

import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    Image,
} from 'react-native';

import {
    insertPatientReport,
} from '../database/db';

import {
    launchCamera,
    launchImageLibrary,
} from 'react-native-image-picker';

import ScreenContainer from '../components/ScreenContainer';


export default function AddReportScreen({ navigation }) {

    // =====================================================
    // FORM STATES
    // =====================================================

    const [reportType, setReportType] = useState('');
    const [testDate, setTestDate] = useState('');
    const [nextTestDate, setNextTestDate] = useState('');
    const [notes, setNotes] = useState('');

    const [reportImage, setReportImage] = useState(null);


    // =====================================================
    // CAMERA
    // =====================================================

    const handleCamera = async () => {
        try {

            const result = await launchCamera({
                mediaType: 'photo',
                cameraType: 'back',
                quality: 0.8,
                saveToPhotos: false,
            });


            if (result.didCancel) {
                return;
            }


            if (result.errorCode) {

                Alert.alert(
                    'Camera Error',
                    result.errorMessage ||
                    'Camera open nahi ho saka.'
                );

                return;
            }


            const asset = result.assets?.[0];


            if (asset?.uri) {

                setReportImage({
                    uri: asset.uri,
                    type: asset.type,
                    fileName: asset.fileName,
                });

            }

        } catch (error) {

            console.log(
                '[CAMERA ERROR]',
                error
            );

            Alert.alert(
                'Error',
                'Camera open karte waqt problem hui.'
            );
        }
    };


    // =====================================================
    // GALLERY
    // =====================================================

    const handleGallery = async () => {
        try {

            const result = await launchImageLibrary({
                mediaType: 'photo',
                selectionLimit: 1,
                quality: 0.8,
            });


            if (result.didCancel) {
                return;
            }


            if (result.errorCode) {

                Alert.alert(
                    'Gallery Error',
                    result.errorMessage ||
                    'Gallery open nahi ho saki.'
                );

                return;
            }


            const asset = result.assets?.[0];


            if (asset?.uri) {

                setReportImage({
                    uri: asset.uri,
                    type: asset.type,
                    fileName: asset.fileName,
                });

            }

        } catch (error) {

            console.log(
                '[GALLERY ERROR]',
                error
            );

            Alert.alert(
                'Error',
                'Gallery open karte waqt problem hui.'
            );
        }
    };


    // =====================================================
    // SAVE REPORT
    // =====================================================

    const handleSave = async () => {

        try {

            // Required fields
            if (
                !reportType.trim() ||
                !testDate.trim()
            ) {

                Alert.alert(
                    'जानकारी अधूरी है',
                    'कृपया रिपोर्ट का नाम और टेस्ट की तारीख दर्ज करें।'
                );

                return;
            }


            // Save report in SQLite
            const result = await insertPatientReport({

                reportType: reportType.trim(),

                testDate: testDate.trim(),

                nextTestDate: nextTestDate.trim(),

                imageUri: reportImage?.uri || '',

                notes: notes.trim(),

            });


            console.log(
                '[SAVE REPORT RESULT]',
                result
            );


            if (!result?.success) {

                Alert.alert(
                    'Error',
                    'रिपोर्ट सेव नहीं हो सकी।'
                );

                return;
            }


            Alert.alert(
                'सफल',
                'रिपोर्ट सफलतापूर्वक सेव हो गई।',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack(),
                    },
                ]
            );


        } catch (error) {

            console.log(
                '[SAVE REPORT ERROR]',
                error
            );

            Alert.alert(
                'Error',
                'रिपोर्ट सेव करते समय समस्या हुई।'
            );
        }
    };


    // =====================================================
    // UI
    // =====================================================

    return (
        <ScreenContainer>

            <ScrollView
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
            >


                {/* =================================================
                    HEADER
                ================================================= */}

                <View style={styles.header}>

                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => navigation.goBack()}
                    >

                        <Text style={styles.backText}>
                            ← वापस
                        </Text>

                    </TouchableOpacity>


                    <Text style={styles.headerTitle}>
                        नई रिपोर्ट
                    </Text>

                </View>



                {/* =================================================
                    FORM CARD
                ================================================= */}

                <View style={styles.card}>


                    {/* Report Type */}

                    <Text style={styles.label}>
                        रिपोर्ट / टेस्ट का नाम
                    </Text>


                    <TextInput
                        style={styles.input}
                        value={reportType}
                        onChangeText={setReportType}
                        placeholder="जैसे Blood Sugar, BP, HbA1c"
                        placeholderTextColor="#94A3B8"
                    />



                    {/* Test Date */}

                    <Text style={styles.label}>
                        टेस्ट की तारीख
                    </Text>


                    <TextInput
                        style={styles.input}
                        value={testDate}
                        onChangeText={setTestDate}
                        placeholder="DD-MM-YYYY"
                        placeholderTextColor="#94A3B8"
                        keyboardType="numeric"
                    />



                    {/* Next Test Date */}

                    <Text style={styles.label}>
                        अगला टेस्ट कब करना है?
                    </Text>


                    <TextInput
                        style={styles.input}
                        value={nextTestDate}
                        onChangeText={setNextTestDate}
                        placeholder="DD-MM-YYYY (Optional)"
                        placeholderTextColor="#94A3B8"
                        keyboardType="numeric"
                    />



                    {/* Report */}

                    <Text style={styles.label}>
                        रिपोर्ट जोड़ें
                    </Text>


                    {/* =================================================
                        IMAGE PREVIEW
                    ================================================= */}

                    {reportImage?.uri && (

                        <View style={styles.previewContainer}>

                            <Text style={styles.previewLabel}>
                                चुनी गई रिपोर्ट
                            </Text>


                            <Image
                                source={{
                                    uri: reportImage.uri,
                                }}
                                style={styles.reportPreview}
                                resizeMode="cover"
                            />


                            <TouchableOpacity
                                style={styles.removeImageBtn}
                                onPress={() => setReportImage(null)}
                            >

                                <Text style={styles.removeImageText}>
                                    ✕ फोटो हटाएं
                                </Text>

                            </TouchableOpacity>

                        </View>
                    )}



                    {/* =================================================
                        CAMERA / GALLERY
                    ================================================= */}

                    <View style={styles.sourceRow}>

                        <TouchableOpacity
                            style={styles.sourceBtn}
                            onPress={handleCamera}
                        >

                            <Text style={styles.sourceIcon}>
                                📷
                            </Text>


                            <Text style={styles.sourceText}>
                                Camera
                            </Text>

                        </TouchableOpacity>



                        <TouchableOpacity
                            style={styles.sourceBtn}
                            onPress={handleGallery}
                        >

                            <Text style={styles.sourceIcon}>
                                🖼️
                            </Text>


                            <Text style={styles.sourceText}>
                                Gallery
                            </Text>

                        </TouchableOpacity>

                    </View>



                    {/* =================================================
                        NOTES
                    ================================================= */}

                    <Text style={styles.label}>
                        अतिरिक्त जानकारी
                    </Text>


                    <TextInput
                        style={[
                            styles.input,
                            styles.notesInput,
                        ]}
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="डॉक्टर की सलाह या कोई अन्य जानकारी"
                        placeholderTextColor="#94A3B8"
                        multiline
                        textAlignVertical="top"
                    />


                </View>



                {/* =================================================
                    SAVE BUTTON
                ================================================= */}

                <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={handleSave}
                >

                    <Text style={styles.saveBtnText}>
                        ✓ रिपोर्ट सेव करें
                    </Text>

                </TouchableOpacity>


            </ScrollView>

        </ScreenContainer>
    );
}



// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({

    container: {
        padding: 20,
        paddingBottom: 40,
    },


    // =====================================================
    // HEADER
    // =====================================================

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },


    backBtn: {
        backgroundColor: '#E2E8F0',
        paddingHorizontal: 12,
        paddingVertical: 9,
        borderRadius: 9,
        marginRight: 12,
    },


    backText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1E293B',
    },


    headerTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#0F172A',
    },


    // =====================================================
    // CARD
    // =====================================================

    card: {
        backgroundColor: '#FFFFFF',
        padding: 18,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#CBD5E1',
    },


    label: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1E293B',
        marginTop: 8,
        marginBottom: 7,
    },


    input: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1.2,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        padding: 13,
        fontSize: 16,
        fontWeight: '600',
        color: '#0F172A',
    },


    notesInput: {
        height: 100,
    },


    // =====================================================
    // CAMERA / GALLERY
    // =====================================================

    sourceRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 10,
    },


    sourceBtn: {
        flex: 1,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },


    sourceIcon: {
        fontSize: 30,
        marginBottom: 5,
    },


    sourceText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1E293B',
    },


    // =====================================================
    // IMAGE PREVIEW
    // =====================================================

    previewContainer: {
        marginTop: 8,
        marginBottom: 10,
    },


    previewLabel: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 8,
    },


    reportPreview: {
        width: '100%',
        height: 220,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
    },


    removeImageBtn: {
        marginTop: 8,
        alignSelf: 'flex-start',
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },


    removeImageText: {
        color: '#DC2626',
        fontSize: 13,
        fontWeight: '800',
    },


    // =====================================================
    // SAVE BUTTON
    // =====================================================

    saveBtn: {
        backgroundColor: '#16A34A',
        padding: 17,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 18,
    },


    saveBtnText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '900',
    },

});