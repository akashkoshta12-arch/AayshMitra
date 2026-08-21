import React, { useState } from 'react';

import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    Modal,
} from 'react-native';

import ScreenContainer from '../components/ScreenContainer';

import {
    insertHealthReading,
} from '../database/db';


console.log('🔥 HEALTH TRACKING FILE LOADED');


export default function HealthTrackingScreen({ navigation }) {

    // =====================================================
    // STATE
    // =====================================================

    const [activeTab, setActiveTab] = useState('BP');


    // BP
    const [systolic, setSystolic] = useState('');
    const [diastolic, setDiastolic] = useState('');


    // Sugar
    const [sugarValue, setSugarValue] = useState('');


    // Reading Time
    const [readingTime, setReadingTime] =
        useState('MORNING');


    // Meal Timing
    const [mealTiming, setMealTiming] =
        useState('BEFORE_MEAL');


    // Meal Dropdown
    const [showMealDropdown, setShowMealDropdown] =
        useState(false);


    // =====================================================
    // READING TIME OPTIONS
    // =====================================================

    const readingOptions = [
        {
            id: 'MORNING',
            label: '🌅 सुबह',
        },
        {
            id: 'AFTERNOON',
            label: '☀️ दोपहर',
        },
        {
            id: 'EVENING',
            label: '🌇 शाम',
        },
        {
            id: 'NIGHT',
            label: '🌙 रात',
        },
    ];


    // =====================================================
    // MEAL OPTIONS
    // =====================================================

    const mealOptions = [
        {
            id: 'BEFORE_MEAL',
            label: '🍽️ खाने से पहले',
        },
        {
            id: 'AFTER_MEAL',
            label: '🍛 खाने के बाद',
        },
    ];


    // =====================================================
    // GET MEAL LABEL
    // =====================================================

    const getMealTimingLabel = () => {

        const item = mealOptions.find(
            item => item.id === mealTiming
        );

        return (
            item?.label ||
            '🍽️ खाने से पहले'
        );
    };


    // =====================================================
    // RESET FORM
    // =====================================================

    const resetForm = () => {

        setSystolic('');
        setDiastolic('');
        setSugarValue('');

        setReadingTime('MORNING');

        setMealTiming('BEFORE_MEAL');

        setShowMealDropdown(false);
    };


    // =====================================================
    // SAVE READING
    // =====================================================

    const handleSave = async () => {

        console.log(
            '===== SAVE READING BUTTON CLICKED ====='
        );


        try {

            let value = '';


            // =================================================
            // BP
            // =================================================

            if (activeTab === 'BP') {

                if (
                    !systolic.trim() ||
                    !diastolic.trim()
                ) {

                    Alert.alert(
                        'जानकारी अधूरी है',
                        'कृपया Systolic और Diastolic दोनों दर्ज करें।'
                    );

                    return;
                }


                value =
                    `${systolic.trim()}/${diastolic.trim()}`;
            }


            // =================================================
            // SUGAR
            // =================================================

            if (activeTab === 'SUGAR') {

                if (!sugarValue.trim()) {

                    Alert.alert(
                        'जानकारी अधूरी है',
                        'कृपया Blood Sugar की reading दर्ज करें।'
                    );

                    return;
                }


                value =
                    sugarValue.trim();
            }


            // =================================================
            // DEBUG
            // =================================================

            console.log(
                '[HEALTH] Data to save:',
                {
                    type: activeTab,
                    value,
                    readingTime,
                    mealTiming,
                }
            );


            // =================================================
            // DATABASE
            // =================================================

            const result =
                await insertHealthReading({

                    type: activeTab,

                    value,

                    readingTime,

                    mealTiming,

                });


            console.log(
                '[HEALTH] Insert result:',
                result
            );


            // =================================================
            // SAVE FAILED
            // =================================================

            if (!result?.success) {

                Alert.alert(
                    'Error',
                    'Reading save नहीं हो सकी।'
                );

                return;
            }


            // =================================================
            // SUCCESS
            // =================================================

            Alert.alert(

                'सफल',

                activeTab === 'BP'
                    ? 'BP reading सफलतापूर्वक save हो गई।'
                    : 'Sugar reading सफलतापूर्वक save हो गई।'

            );


            resetForm();


        } catch (error) {

            console.log(
                '[HEALTH SAVE ERROR]',
                error
            );


            Alert.alert(
                'Error',
                'Reading save करते समय समस्या हुई।'
            );
        }
    };


    // =====================================================
    // MAIN UI
    // =====================================================

    return (

        <ScreenContainer>

            <ScrollView
                contentContainerStyle={
                    styles.container
                }
                showsVerticalScrollIndicator={false}
            >


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
                        दैनिक स्वास्थ्य
                    </Text>

                </View>



                {/* =================================================
                    INTRO
                ================================================= */}

                <View style={styles.introCard}>

                    <Text style={styles.introIcon}>
                        🩺
                    </Text>


                    <View style={styles.introContent}>

                        <Text style={styles.introTitle}>
                            BP / Sugar Record
                        </Text>


                        <Text style={styles.introText}>
                            अपनी रोज़ की स्वास्थ्य रीडिंग यहां सुरक्षित रखें।
                        </Text>

                    </View>

                </View>



                {/* =================================================
                    HEALTH HISTORY
                ================================================= */}

                <TouchableOpacity
                    style={styles.historyBtn}
                    onPress={() =>
                        navigation.navigate(
                            'HealthHistory'
                        )
                    }
                >

                    <Text style={styles.historyBtnText}>
                        📊 स्वास्थ्य इतिहास देखें
                    </Text>

                </TouchableOpacity>



                {/* =================================================
                    REMINDER
                ================================================= */}

                <TouchableOpacity
                    style={styles.reminderBtn}
                    onPress={() =>
                        navigation.navigate(
                            'HealthReminder'
                        )
                    }
                >

                    <Text style={styles.reminderBtnText}>
                        🔔 BP / Sugar Reminder
                    </Text>

                </TouchableOpacity>



                {/* =================================================
                    BP / SUGAR TABS
                ================================================= */}

                <View style={styles.tabContainer}>


                    {/* BP */}

                    <TouchableOpacity
                        style={[
                            styles.tab,

                            activeTab === 'BP' &&
                            styles.activeTab,
                        ]}
                        onPress={() => {

                            setActiveTab('BP');

                            resetForm();

                        }}
                    >

                        <Text
                            style={[
                                styles.tabText,

                                activeTab === 'BP' &&
                                styles.activeTabText,
                            ]}
                        >
                            🩺 Blood Pressure
                        </Text>

                    </TouchableOpacity>



                    {/* SUGAR */}

                    <TouchableOpacity
                        style={[
                            styles.tab,

                            activeTab === 'SUGAR' &&
                            styles.activeTab,
                        ]}
                        onPress={() => {

                            setActiveTab('SUGAR');

                            resetForm();

                        }}
                    >

                        <Text
                            style={[
                                styles.tabText,

                                activeTab === 'SUGAR' &&
                                styles.activeTabText,
                            ]}
                        >
                            🩸 Blood Sugar
                        </Text>

                    </TouchableOpacity>


                </View>



                {/* =================================================
                    READING FORM
                ================================================= */}

                <View style={styles.sectionCard}>


                    <Text style={styles.sectionTitle}>

                        {activeTab === 'BP'
                            ? '🩺 Blood Pressure'
                            : '🩸 Blood Sugar'}

                    </Text>


                    <Text style={styles.sectionDescription}>

                        {activeTab === 'BP'
                            ? 'आज की BP reading दर्ज करें'
                            : 'आज की Sugar reading दर्ज करें'}

                    </Text>



                    {/* =================================================
                        READING TIME
                    ================================================= */}

                    <Text style={styles.label}>
                        Reading का समय
                    </Text>


                    <View style={styles.timeGrid}>

                        {readingOptions.map(
                            (option) => (

                                <TouchableOpacity
                                    key={option.id}

                                    style={[
                                        styles.timeBtn,

                                        readingTime === option.id &&
                                        styles.activeTimeBtn,
                                    ]}

                                    onPress={() =>
                                        setReadingTime(
                                            option.id
                                        )
                                    }
                                >

                                    <Text
                                        style={[
                                            styles.timeText,

                                            readingTime === option.id &&
                                            styles.activeTimeText,
                                        ]}
                                    >
                                        {option.label}
                                    </Text>

                                </TouchableOpacity>

                            )
                        )}

                    </View>



                    {/* =================================================
                        MEAL DROPDOWN
                    ================================================= */}

                    <Text style={styles.label}>
                        खाने के संबंध में
                    </Text>


                    <TouchableOpacity
                        style={styles.dropdownBtn}
                        activeOpacity={0.8}
                        onPress={() =>
                            setShowMealDropdown(true)
                        }
                    >

                        <Text style={styles.dropdownText}>
                            {getMealTimingLabel()}
                        </Text>


                        <Text style={styles.dropdownArrow}>
                            ▼
                        </Text>

                    </TouchableOpacity>



                    {/* =================================================
                        MEAL DROPDOWN MODAL
                    ================================================= */}

                    <Modal
                        visible={showMealDropdown}
                        transparent={true}
                        animationType="fade"

                        onRequestClose={() =>
                            setShowMealDropdown(false)
                        }
                    >

                        <TouchableOpacity
                            style={styles.modalOverlay}
                            activeOpacity={1}
                            onPress={() =>
                                setShowMealDropdown(false)
                            }
                        >

                            <View
                                style={styles.dropdownBox}
                                onStartShouldSetResponder={() =>
                                    true
                                }
                            >


                                <Text style={styles.dropdownTitle}>
                                    खाने के संबंध में चुनें
                                </Text>



                                {/* BEFORE MEAL / AFTER MEAL */}

                                {mealOptions.map(
                                    (item) => (

                                        <TouchableOpacity
                                            key={item.id}

                                            style={[
                                                styles.dropdownOption,

                                                mealTiming === item.id &&
                                                styles.selectedDropdownOption,
                                            ]}

                                            onPress={() => {

                                                setMealTiming(
                                                    item.id
                                                );

                                                setShowMealDropdown(
                                                    false
                                                );

                                            }}
                                        >

                                            <Text
                                                style={[
                                                    styles.dropdownOptionText,

                                                    mealTiming === item.id &&
                                                    styles.selectedDropdownText,
                                                ]}
                                            >
                                                {item.label}
                                            </Text>

                                        </TouchableOpacity>

                                    )
                                )}

                            </View>

                        </TouchableOpacity>

                    </Modal>



                    {/* =================================================
                        BP FIELDS
                    ================================================= */}

                    {activeTab === 'BP' && (

                        <View>


                            <Text style={styles.label}>
                                Systolic (ऊपरी BP)
                            </Text>


                            <TextInput
                                style={styles.input}
                                value={systolic}
                                onChangeText={
                                    setSystolic
                                }
                                placeholder="जैसे 128"
                                placeholderTextColor="#94A3B8"
                                keyboardType="numeric"
                                maxLength={3}
                            />


                            <Text style={styles.label}>
                                Diastolic (निचला BP)
                            </Text>


                            <TextInput
                                style={styles.input}
                                value={diastolic}
                                onChangeText={
                                    setDiastolic
                                }
                                placeholder="जैसे 82"
                                placeholderTextColor="#94A3B8"
                                keyboardType="numeric"
                                maxLength={3}
                            />


                            <Text style={styles.unitText}>
                                Unit: mmHg
                            </Text>


                        </View>
                    )}



                    {/* =================================================
                        SUGAR FIELD
                    ================================================= */}

                    {activeTab === 'SUGAR' && (

                        <View>


                            <Text style={styles.label}>
                                Blood Sugar
                            </Text>


                            <View style={styles.sugarInputRow}>

                                <TextInput
                                    style={styles.sugarInput}
                                    value={sugarValue}
                                    onChangeText={
                                        setSugarValue
                                    }
                                    placeholder="जैसे 108"
                                    placeholderTextColor="#94A3B8"
                                    keyboardType="numeric"
                                    maxLength={4}
                                />


                                <Text style={styles.sugarUnit}>
                                    mg/dL
                                </Text>

                            </View>


                        </View>
                    )}



                    {/* =================================================
                        SAVE
                    ================================================= */}

                    <TouchableOpacity
                        style={styles.saveBtn}
                        activeOpacity={0.8}
                        onPress={handleSave}
                    >

                        <Text style={styles.saveBtnText}>
                            ✓ Reading सेव करें
                        </Text>

                    </TouchableOpacity>


                </View>


            </ScrollView>

        </ScreenContainer>
    );
}



// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({

    // =====================================================
    // CONTAINER
    // =====================================================

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
        marginBottom: 18,
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
    // INTRO
    // =====================================================

    introCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF7ED',
        borderWidth: 1,
        borderColor: '#FED7AA',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },


    introIcon: {
        fontSize: 42,
        marginRight: 13,
    },


    introContent: {
        flex: 1,
    },


    introTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0F172A',
    },


    introText: {
        marginTop: 4,
        fontSize: 13,
        lineHeight: 18,
        color: '#64748B',
    },


    // =====================================================
    // HISTORY
    // =====================================================

    historyBtn: {
        backgroundColor: '#E0F2FE',
        borderWidth: 1,
        borderColor: '#7DD3FC',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 0,
        marginBottom: 10,
    },


    historyBtnText: {
        color: '#0369A1',
        fontSize: 16,
        fontWeight: '900',
    },


    // =====================================================
    // REMINDER
    // =====================================================

    reminderBtn: {
        backgroundColor: '#E0F2FE',
        borderWidth: 1,
        borderColor: '#7DD3FC',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 5,
    },


    reminderBtnText: {
        color: '#0369A1',
        fontSize: 16,
        fontWeight: '900',
    },


    // =====================================================
    // TABS
    // =====================================================

    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#E2E8F0',
        padding: 4,
        borderRadius: 12,
        marginBottom: 16,
    },


    tab: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 9,
        alignItems: 'center',
    },


    activeTab: {
        backgroundColor: '#FFFFFF',
        elevation: 2,
    },


    tabText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#64748B',
    },


    activeTabText: {
        color: '#0284C7',
    },


    // =====================================================
    // SECTION CARD
    // =====================================================

    sectionCard: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        padding: 18,
    },


    sectionTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#0F172A',
    },


    sectionDescription: {
        marginTop: 5,
        fontSize: 13,
        color: '#64748B',
        marginBottom: 8,
    },


    // =====================================================
    // LABEL
    // =====================================================

    label: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1E293B',
        marginTop: 14,
        marginBottom: 7,
    },


    // =====================================================
    // READING TIME
    // =====================================================

    timeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },


    timeBtn: {
        width: '48%',
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        alignItems: 'center',
    },


    activeTimeBtn: {
        backgroundColor: '#0284C7',
        borderColor: '#0284C7',
    },


    timeText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#334155',
    },


    activeTimeText: {
        color: '#FFFFFF',
    },


    // =====================================================
    // INPUT
    // =====================================================

    input: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1.2,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        padding: 13,
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },


    unitText: {
        marginTop: 5,
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600',
    },


    // =====================================================
    // SUGAR
    // =====================================================

    sugarInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },


    sugarInput: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        borderWidth: 1.2,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        padding: 13,
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },


    sugarUnit: {
        marginLeft: 10,
        fontSize: 14,
        fontWeight: '800',
        color: '#475569',
    },


    // =====================================================
    // MEAL DROPDOWN
    // =====================================================

    dropdownBtn: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1.2,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 14,

        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },


    dropdownText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#334155',
    },


    dropdownArrow: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '900',
    },


    // =====================================================
    // MODAL
    // =====================================================

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        paddingHorizontal: 25,
    },


    dropdownBox: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 18,
        elevation: 5,
    },


    dropdownTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 12,
    },


    dropdownOption: {
        backgroundColor: '#F1F5F9',
        borderRadius: 10,
        paddingVertical: 15,
        paddingHorizontal: 14,
        marginBottom: 8,
    },


    selectedDropdownOption: {
        backgroundColor: '#0284C7',
    },


    dropdownOptionText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#334155',
    },


    selectedDropdownText: {
        color: '#FFFFFF',
    },


    // =====================================================
    // SAVE
    // =====================================================

    saveBtn: {
        backgroundColor: '#16A34A',
        paddingVertical: 17,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 24,
    },


    saveBtnText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '900',
    },

});