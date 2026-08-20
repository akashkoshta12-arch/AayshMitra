import React, { useState, useCallback } from 'react';

import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Image,
    Alert,
} from 'react-native';

import { useFocusEffect } from '@react-navigation/native';

import ScreenContainer from '../components/ScreenContainer';

import {
    getAllPatientReports,
    deletePatientReport,
} from '../database/db';


export default function ReportsScreen({ navigation }) {

    // =====================================================
    // STATE
    // =====================================================

    const [reports, setReports] = useState([]);


    // =====================================================
    // LOAD REPORTS
    // =====================================================

    const loadReports = async () => {

        try {

            const list = await getAllPatientReports();

            console.log('[REPORTS] Loaded:', list);

            setReports(list || []);

        } catch (error) {

            console.log(
                '[LOAD REPORTS ERROR]',
                error
            );

            setReports([]);
        }
    };


    // =====================================================
    // SCREEN FOCUS
    // =====================================================

    useFocusEffect(
        useCallback(() => {

            loadReports();

        }, [])
    );


    // =====================================================
    // DELETE REPORT
    // =====================================================

    const handleDeleteReport = (
        id,
        reportName
    ) => {

        Alert.alert(
            'रिपोर्ट हटाएं?',
            `क्या आप "${reportName}" रिपोर्ट हटाना चाहते हैं?`,

            [

                // Cancel
                {
                    text: 'रद्द करें',
                    style: 'cancel',
                },


                // Delete
                {
                    text: 'हटाएं',
                    style: 'destructive',

                    onPress: async () => {

                        try {

                            console.log(
                                '[DELETE REPORT] ID:',
                                id
                            );


                            const success =
                                await deletePatientReport(id);


                            console.log(
                                '[DELETE REPORT] Result:',
                                success
                            );


                            if (success) {

                                // Delete ke baad list refresh
                                await loadReports();


                                Alert.alert(
                                    'सफल',
                                    'रिपोर्ट हटा दी गई।'
                                );

                            } else {

                                Alert.alert(
                                    'Error',
                                    'रिपोर्ट delete नहीं हो सकी।'
                                );

                            }

                        } catch (error) {

                            console.log(
                                '[DELETE REPORT ERROR]',
                                error
                            );


                            Alert.alert(
                                'Error',
                                'रिपोर्ट delete करते समय समस्या हुई।'
                            );
                        }
                    },
                },
            ]
        );
    };


    // =====================================================
    // RENDER REPORT
    // =====================================================

    const renderReport = ({ item }) => {

        return (

            <View style={styles.reportCard}>


                {/* =================================================
                    REPORT IMAGE
                ================================================= */}

                {item.image_uri ? (

                    <Image
                        source={{
                            uri: item.image_uri,
                        }}
                        style={styles.reportImage}
                        resizeMode="cover"
                    />

                ) : (

                    <View style={styles.imagePlaceholder}>

                        <Text style={styles.placeholderIcon}>
                            🧪
                        </Text>

                    </View>
                )}



                {/* =================================================
                    REPORT INFORMATION
                ================================================= */}

                <View style={styles.reportInfo}>


                    <Text
                        style={styles.reportName}
                        numberOfLines={1}
                    >
                        {item.report_type}
                    </Text>


                    <Text style={styles.dateText}>
                        📅 टेस्ट: {item.test_date}
                    </Text>


                    {item.next_test_date ? (

                        <Text style={styles.nextDateText}>
                            🔔 अगला टेस्ट: {item.next_test_date}
                        </Text>

                    ) : null}


                    {item.notes ? (

                        <Text
                            style={styles.notes}
                            numberOfLines={2}
                        >
                            📝 {item.notes}
                        </Text>

                    ) : null}


                </View>



                {/* =================================================
                    DELETE BUTTON
                ================================================= */}

                <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() =>
                        handleDeleteReport(
                            item.id,
                            item.report_type
                        )
                    }
                >

                    <Text style={styles.deleteIcon}>
                        🗑️
                    </Text>

                </TouchableOpacity>


            </View>
        );
    };


    // =====================================================
    // SCREEN
    // =====================================================

    return (

        <ScreenContainer>

            <View style={styles.container}>


                {/* =================================================
                    HEADER
                ================================================= */}

                <View style={styles.header}>


                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() =>
                            navigation.goBack()
                        }
                    >

                        <Text style={styles.backText}>
                            ← वापस
                        </Text>

                    </TouchableOpacity>


                    <Text style={styles.headerTitle}>
                        मरीज की रिपोर्ट
                    </Text>


                </View>



                {/* =================================================
                    REPORT COUNT
                ================================================= */}

                <View style={styles.summaryBox}>


                    <Text style={styles.summaryIcon}>
                        🧪
                    </Text>


                    <View>

                        <Text style={styles.summaryTitle}>
                            कुल रिपोर्ट
                        </Text>


                        <Text style={styles.summaryCount}>
                            {reports.length}
                        </Text>

                    </View>


                </View>



                {/* =================================================
                    REPORT LIST
                ================================================= */}

                <FlatList
                    data={reports}

                    keyExtractor={(item) =>
                        String(item.id)
                    }

                    renderItem={renderReport}

                    showsVerticalScrollIndicator={false}

                    contentContainerStyle={
                        reports.length === 0
                            ? styles.emptyList
                            : styles.listContent
                    }


                    ListEmptyComponent={

                        <View style={styles.emptyBox}>

                            <Text style={styles.emptyIcon}>
                                🧪
                            </Text>


                            <Text style={styles.emptyTitle}>
                                अभी कोई रिपोर्ट नहीं है
                            </Text>


                            <Text style={styles.emptyText}>
                                अपनी मेडिकल रिपोर्ट यहां सुरक्षित रखें
                            </Text>

                        </View>
                    }

                />



                {/* =================================================
                    ADD REPORT BUTTON
                ================================================= */}

                <TouchableOpacity
                    style={styles.addBtn}
                    activeOpacity={0.8}
                    onPress={() =>
                        navigation.navigate('AddReport')
                    }
                >

                    <Text style={styles.addBtnText}>
                        + नई रिपोर्ट जोड़ें
                    </Text>

                </TouchableOpacity>


            </View>

        </ScreenContainer>
    );
}



// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({

    container: {
        flex: 1,
        padding: 20,
    },


    // =====================================================
    // HEADER
    // =====================================================

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
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
    // SUMMARY
    // =====================================================

    summaryBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        borderWidth: 1,
        borderColor: '#BFDBFE',
        borderRadius: 15,
        padding: 14,
        marginBottom: 14,
    },


    summaryIcon: {
        fontSize: 35,
        marginRight: 12,
    },


    summaryTitle: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '700',
    },


    summaryCount: {
        fontSize: 22,
        color: '#0F172A',
        fontWeight: '900',
        marginTop: 1,
    },


    // =====================================================
    // LIST
    // =====================================================

    listContent: {
        paddingBottom: 90,
    },


    emptyList: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingBottom: 80,
    },


    // =====================================================
    // EMPTY
    // =====================================================

    emptyBox: {
        alignItems: 'center',
    },


    emptyIcon: {
        fontSize: 65,
        marginBottom: 15,
    },


    emptyTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#0F172A',
    },


    emptyText: {
        marginTop: 8,
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
    },


    // =====================================================
    // REPORT CARD
    // =====================================================

    reportCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 12,
        marginBottom: 10,
        elevation: 2,
    },


    reportImage: {
        width: 82,
        height: 82,
        borderRadius: 10,
        backgroundColor: '#F1F5F9',
    },


    imagePlaceholder: {
        width: 82,
        height: 82,
        borderRadius: 10,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },


    placeholderIcon: {
        fontSize: 35,
    },


    reportInfo: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },


    reportName: {
        fontSize: 17,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 5,
    },


    dateText: {
        fontSize: 12,
        color: '#475569',
        fontWeight: '600',
        marginBottom: 3,
    },


    nextDateText: {
        fontSize: 12,
        color: '#0284C7',
        fontWeight: '800',
        marginBottom: 3,
    },


    notes: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 2,
    },


    // =====================================================
    // DELETE BUTTON
    // =====================================================

    deleteBtn: {
        width: 42,
        height: 42,
        borderRadius: 10,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },


    deleteIcon: {
        fontSize: 18,
    },


    // =====================================================
    // ADD BUTTON
    // =====================================================

    addBtn: {
        position: 'absolute',
        left: 20,
        right: 20,
        bottom: 15,
        backgroundColor: '#16A34A',
        paddingVertical: 17,
        borderRadius: 15,
        alignItems: 'center',
        elevation: 4,
    },


    addBtnText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '900',
    },

});