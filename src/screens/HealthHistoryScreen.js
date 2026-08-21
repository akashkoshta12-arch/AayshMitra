
import React, { useEffect, useState } from 'react';

import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';

import ScreenContainer from '../components/ScreenContainer';

import {
    getHealthReadings,
} from '../database/db';


export default function HealthHistoryScreen({ navigation }) {

    // =====================================================
    // STATE
    // =====================================================

    const [readings, setReadings] = useState([]);

    // ALL | BP | SUGAR
    const [selectedFilter, setSelectedFilter] = useState('ALL');

    // Open date
    const [expandedDate, setExpandedDate] = useState(null);


    const getMealTimingLabel = (mealTiming) => {
        switch (mealTiming) {
            case 'BEFORE_MEAL':
                return '🍽️ खाने से पहले';

            case 'AFTER_MEAL':
                return '🍛 खाने के बाद';

            default:
                return '';
        }
    };


    // =====================================================
    // LOAD READINGS
    // =====================================================

    const loadReadings = async () => {

        try {

            const list = await getHealthReadings();

            console.log(
                '[HEALTH HISTORY] Readings:',
                list
            );

            setReadings(list || []);

        } catch (error) {

            console.log(
                '[HEALTH HISTORY ERROR]',
                error
            );

            setReadings([]);
        }
    };


    // =====================================================
    // LOAD WHEN SCREEN FOCUSES
    // =====================================================

    useEffect(() => {

        const unsubscribe = navigation.addListener(
            'focus',
            loadReadings
        );

        return unsubscribe;

    }, [navigation]);


    // =====================================================
    // FILTER READINGS
    // =====================================================

    const filteredReadings = readings.filter((item) => {

        // Show everything
        if (selectedFilter === 'ALL') {
            return true;
        }

        // Show only BP
        if (selectedFilter === 'BP') {
            return item.type === 'BP';
        }

        // Show only Sugar
        if (selectedFilter === 'SUGAR') {
            return item.type !== 'BP';
        }

        return true;
    });


    // =====================================================
    // READING TIME LABEL
    // =====================================================

    const getReadingTimeLabel = (time) => {

        switch (time) {

            case 'MORNING':
                return '🌅 सुबह';

            case 'BEFORE_MEAL':
                return '🍽️ खाने से पहले';

            case 'AFTER_MEAL':
                return '🍛 खाने के बाद';

            case 'EVENING':
                return '🌇 शाम';

            default:
                return time || '';
        }
    };


    // =====================================================
    // DATE LABEL
    // =====================================================

    const getDateLabel = (date) => {

        const today = new Date();

        const yesterday = new Date();

        yesterday.setDate(
            today.getDate() - 1
        );


        const todayString =
            today.toISOString().split('T')[0];


        const yesterdayString =
            yesterday.toISOString().split('T')[0];


        if (date === todayString) {
            return 'आज';
        }


        if (date === yesterdayString) {
            return 'कल';
        }


        if (date) {

            const parts = date.split('-');

            if (parts.length === 3) {

                return `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
        }


        return date;
    };


    // =====================================================
    // GROUP FILTERED READINGS BY DATE
    // =====================================================

    const groupedReadings = filteredReadings.reduce(
        (groups, item) => {

            const date = item.date || 'UNKNOWN';


            if (!groups[date]) {
                groups[date] = [];
            }


            groups[date].push(item);


            return groups;

        },
        {}
    );


    // =====================================================
    // SORT DATES
    // Latest date first
    // =====================================================

    const groupedData = Object.keys(
        groupedReadings
    )
        .sort((a, b) =>
            b.localeCompare(a)
        )
        .map((date) => ({

            date,

            readings: groupedReadings[date],

        }));


    // =====================================================
    // TOGGLE DATE
    // =====================================================

    const toggleDate = (date) => {

        if (expandedDate === date) {

            setExpandedDate(null);

        } else {

            setExpandedDate(date);

        }
    };


    // =====================================================
    // FILTER CHANGE
    // =====================================================

    const changeFilter = (filter) => {

        setSelectedFilter(filter);

        // Filter change hone par
        // open date close kar denge
        setExpandedDate(null);
    };


    // =====================================================
    // SINGLE READING CARD
    // =====================================================

    const renderReading = (item) => {

        const isBP =
            item.type === 'BP';


        return (

            <View
                key={String(item.id)}
                style={[
                    styles.readingCard,

                    isBP
                        ? styles.bpCard
                        : styles.sugarCard,
                ]}
            >

                {/* =================================================
            TOP
        ================================================= */}

                <View style={styles.readingTop}>


                    {/* Icon + Name */}

                    <View style={styles.titleContainer}>

                        <Text style={styles.icon}>
                            {isBP ? '🩺' : '🩸'}
                        </Text>


                        <View>

                            <Text style={styles.typeText}>

                                {isBP
                                    ? 'Blood Pressure'
                                    : 'Blood Sugar'}

                            </Text>

                            <Text style={styles.timeText}>
                                {getReadingTimeLabel(item.reading_time)}
                            </Text>

                            {item.meal_timing && (
                                <Text style={styles.mealTimeText}>
                                    {getMealTimingLabel(item.meal_timing)}
                                </Text>
                            )}

                        </View>

                    </View>



                    {/* Value */}

                    <View style={styles.valueBox}>

                        <Text style={styles.valueText}>
                            {item.reading_value}
                        </Text>


                        <Text style={styles.unitText}>

                            {isBP
                                ? 'mmHg'
                                : 'mg/dL'}

                        </Text>

                    </View>

                </View>


                {/* =================================================
            TIME
        ================================================= */}

                <View style={styles.readingBottom}>

                    <Text style={styles.actionTime}>
                        ⏰ {item.action_time || ''}
                    </Text>

                </View>

            </View>
        );
    };


    // =====================================================
    // DATE CARD
    // =====================================================

    const renderDateCard = ({ item }) => {

        const isExpanded =
            expandedDate === item.date;


        const bpCount =
            item.readings.filter(
                reading => reading.type === 'BP'
            ).length;


        const sugarCount =
            item.readings.filter(
                reading => reading.type !== 'BP'
            ).length;


        return (

            <View style={styles.dateSection}>


                {/* =================================================
            DATE BOX
        ================================================= */}

                <TouchableOpacity
                    activeOpacity={0.8}
                    style={[
                        styles.dateCard,

                        isExpanded &&
                        styles.dateCardExpanded,
                    ]}
                    onPress={() =>
                        toggleDate(item.date)
                    }
                >


                    {/* Date Icon */}

                    <View style={styles.dateIconBox}>

                        <Text style={styles.dateIcon}>
                            📅
                        </Text>

                    </View>


                    {/* Date Information */}

                    <View style={styles.dateInfo}>

                        <Text style={styles.dateTitle}>
                            {getDateLabel(item.date)}
                        </Text>


                        <Text style={styles.fullDate}>
                            {item.date}
                        </Text>


                        <View style={styles.countRow}>


                            {bpCount > 0 && (

                                <Text style={styles.bpCount}>
                                    🩺 BP {bpCount}
                                </Text>

                            )}


                            {sugarCount > 0 && (

                                <Text style={styles.sugarCount}>
                                    🩸 Sugar {sugarCount}
                                </Text>

                            )}


                        </View>

                    </View>


                    {/* Arrow */}

                    <View style={styles.arrowBox}>

                        <Text style={styles.arrow}>
                            {isExpanded ? '⌃' : '›'}
                        </Text>

                    </View>


                </TouchableOpacity>



                {/* =================================================
            EXPANDED READINGS
        ================================================= */}

                {isExpanded && (

                    <View style={styles.readingsContainer}>

                        <Text style={styles.todayTitle}>

                            {getDateLabel(item.date)}

                            {selectedFilter === 'BP'
                                ? ' की BP readings'
                                : selectedFilter === 'SUGAR'
                                    ? ' की Sugar readings'
                                    : ' की readings'}

                        </Text>


                        {item.readings.map(
                            (reading) =>
                                renderReading(reading)
                        )}

                    </View>

                )}

            </View>
        );
    };


    // =====================================================
    // EMPTY STATE
    // =====================================================

    const renderEmpty = () => {

        let message =
            'BP या Sugar की reading save करने के बाद यहां दिखाई देगी।';


        if (selectedFilter === 'BP') {

            message =
                'अभी कोई Blood Pressure reading नहीं है।';

        }


        if (selectedFilter === 'SUGAR') {

            message =
                'अभी कोई Blood Sugar reading नहीं है.';

        }


        return (

            <View style={styles.emptyBox}>

                <Text style={styles.emptyIcon}>
                    📊
                </Text>


                <Text style={styles.emptyTitle}>
                    अभी कोई रिकॉर्ड नहीं है
                </Text>


                <Text style={styles.emptyText}>
                    {message}
                </Text>

            </View>
        );
    };


    // =====================================================
    // MAIN UI
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
                        स्वास्थ्य इतिहास
                    </Text>

                </View>



                {/* =================================================
            FILTER
        ================================================= */}

                <View style={styles.filterContainer}>


                    {/* ALL */}

                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={[
                            styles.filterBtn,

                            selectedFilter === 'ALL' &&
                            styles.filterBtnActive,
                        ]}
                        onPress={() =>
                            changeFilter('ALL')
                        }
                    >

                        <Text
                            style={[
                                styles.filterText,

                                selectedFilter === 'ALL' &&
                                styles.filterTextActive,
                            ]}
                        >
                            सभी
                        </Text>

                    </TouchableOpacity>



                    {/* BP */}

                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={[
                            styles.filterBtn,

                            selectedFilter === 'BP' &&
                            styles.bpFilterActive,
                        ]}
                        onPress={() =>
                            changeFilter('BP')
                        }
                    >

                        <Text
                            style={[
                                styles.filterText,

                                selectedFilter === 'BP' &&
                                styles.filterTextActive,
                            ]}
                        >
                            🩺 BP
                        </Text>

                    </TouchableOpacity>



                    {/* SUGAR */}

                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={[
                            styles.filterBtn,

                            selectedFilter === 'SUGAR' &&
                            styles.sugarFilterActive,
                        ]}
                        onPress={() =>
                            changeFilter('SUGAR')
                        }
                    >

                        <Text
                            style={[
                                styles.filterText,

                                selectedFilter === 'SUGAR' &&
                                styles.filterTextActive,
                            ]}
                        >
                            🩸 Sugar
                        </Text>

                    </TouchableOpacity>


                </View>



                {/* =================================================
            DATE LIST
        ================================================= */}

                <FlatList

                    data={groupedData}

                    keyExtractor={(item) =>
                        String(item.date)
                    }

                    renderItem={renderDateCard}

                    showsVerticalScrollIndicator={false}

                    contentContainerStyle={
                        groupedData.length === 0
                            ? styles.emptyList
                            : styles.list
                    }

                    ListEmptyComponent={
                        renderEmpty
                    }

                />


            </View>

        </ScreenContainer>
    );
}



// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({

    // =====================================================
    // MAIN
    // =====================================================

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
        marginBottom: 15,
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
    // FILTER
    // =====================================================

    filterContainer: {
        flexDirection: 'row',
        backgroundColor: '#F1F5F9',
        borderRadius: 13,
        padding: 4,
        marginBottom: 15,
    },


    filterBtn: {
        flex: 1,
        paddingVertical: 11,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },


    filterBtnActive: {
        backgroundColor: '#0F172A',
    },


    bpFilterActive: {
        backgroundColor: '#0284C7',
    },


    sugarFilterActive: {
        backgroundColor: '#DC2626',
    },


    filterText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#475569',
    },


    filterTextActive: {
        color: '#FFFFFF',
    },


    // =====================================================
    // LIST
    // =====================================================

    list: {
        paddingBottom: 20,
    },


    emptyList: {
        flexGrow: 1,
        justifyContent: 'center',
    },


    // =====================================================
    // DATE SECTION
    // =====================================================

    dateSection: {
        marginBottom: 12,
    },


    // =====================================================
    // DATE CARD
    // =====================================================

    dateCard: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 16,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2,
    },


    dateCardExpanded: {
        borderColor: '#94A3B8',
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
    },


    // =====================================================
    // DATE ICON
    // =====================================================

    dateIconBox: {
        width: 52,
        height: 52,
        borderRadius: 13,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 13,
    },


    dateIcon: {
        fontSize: 28,
    },


    // =====================================================
    // DATE INFO
    // =====================================================

    dateInfo: {
        flex: 1,
    },


    dateTitle: {
        fontSize: 19,
        fontWeight: '900',
        color: '#0F172A',
    },


    fullDate: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600',
        marginTop: 2,
    },


    countRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginTop: 7,
    },


    bpCount: {
        fontSize: 12,
        color: '#0284C7',
        fontWeight: '800',
        marginRight: 12,
    },


    sugarCount: {
        fontSize: 12,
        color: '#DC2626',
        fontWeight: '800',
    },


    // =====================================================
    // ARROW
    // =====================================================

    arrowBox: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },


    arrow: {
        fontSize: 25,
        fontWeight: '900',
        color: '#334155',
    },


    // =====================================================
    // EXPANDED AREA
    // =====================================================

    readingsContainer: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderTopWidth: 0,
        borderColor: '#CBD5E1',
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        padding: 12,
    },


    todayTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: '#475569',
        marginBottom: 8,
    },


    // =====================================================
    // READING CARD
    // =====================================================

    readingCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 14,
        marginBottom: 9,
        borderWidth: 1,
    },


    bpCard: {
        borderColor: '#BAE6FD',
    },


    sugarCard: {
        borderColor: '#FECACA',
    },


    // =====================================================
    // READING TOP
    // =====================================================

    readingTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },


    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },


    icon: {
        fontSize: 29,
        marginRight: 10,
    },


    typeText: {
        fontSize: 15,
        fontWeight: '900',
        color: '#0F172A',
    },


    timeText: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 4,
        fontWeight: '700',
    },


    // =====================================================
    // READING VALUE
    // =====================================================

    valueBox: {
        alignItems: 'flex-end',
    },


    valueText: {
        fontSize: 22,
        fontWeight: '900',
        color: '#0F172A',
    },


    unitText: {
        fontSize: 10,
        color: '#64748B',
        marginTop: 1,
        fontWeight: '700',
    },


    // =====================================================
    // READING BOTTOM
    // =====================================================

    readingBottom: {
        marginTop: 9,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },


    actionTime: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '700',
    },


    // =====================================================
    // EMPTY
    // =====================================================

    emptyBox: {
        alignItems: 'center',
        padding: 25,
    },


    emptyIcon: {
        fontSize: 55,
        marginBottom: 12,
    },


    emptyTitle: {
        fontSize: 17,
        fontWeight: '900',
        color: '#334155',
        textAlign: 'center',
    },


    emptyText: {
        marginTop: 7,
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 19,
    },

});