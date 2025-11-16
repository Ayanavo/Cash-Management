import React, { useMemo } from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts/dist/LineChart';

export type ChartPoint = {
	value: number;
	label?: string;
	dataPointText?: string;
};

type ChartComponentProps = {
	title?: string;
	data: ChartPoint[];
	height?: number;
	lineColor?: string;
	startFillColor?: string;
	endFillColor?: string;
};

export default function ChartComponent({
	title = 'Area Chart',
	data,
	height = 220,
	lineColor,
	startFillColor,
	endFillColor,
}: ChartComponentProps) {
	const screenWidth = Dimensions.get('window').width;
	const approxHorizontalPadding = 40;
	const availableWidth = Math.max(100, screenWidth - approxHorizontalPadding);
	const computedSpacing = Math.max(
		44,
		Math.floor(availableWidth / Math.max(1, data.length - 1)),
	);

	// ---- Dynamic up/down colors ----
	const { resolvedLineColor, resolvedStartFillColor, resolvedEndFillColor } =
		useMemo(() => {
			const hasTrend = data && data.length > 1;
			const isUpTrend =
				hasTrend && data[data.length - 1].value >= data[0].value;

			const trendLineColor = isUpTrend ? '#16A34A' : '#DC2626'; // green / red
			const trendStartFill = isUpTrend
				? 'rgba(34,197,94,0.25)'
				: 'rgba(248,113,113,0.25)';
			const trendEndFill = isUpTrend
				? 'rgba(22,163,74,0.03)'
				: 'rgba(220,38,38,0.03)';

			return {
				resolvedLineColor: lineColor || trendLineColor,
				resolvedStartFillColor: startFillColor || trendStartFill,
				resolvedEndFillColor: endFillColor || trendEndFill,
			};
		}, [data, lineColor, startFillColor, endFillColor]);

	if (!data || data.length === 0) {
		return (
			<View style={styles.card}>
				<Text style={styles.title}>{title}</Text>
				<View style={styles.emptyState}>
					<Text style={styles.emptyText}>No data to display</Text>
				</View>
			</View>
		);
	}

	return (
		<View style={styles.card}>
			<Text style={styles.title}>{title}</Text>
			<View style={styles.chartWrapper}>
				<LineChart
					spacing={computedSpacing}
					areaChart
					isAnimated
					animationDuration={1200}
					data={data}
					height={height}
					color={resolvedLineColor}
					startFillColor={resolvedStartFillColor}
					endFillColor={resolvedEndFillColor}
					startOpacity={0.8}
					endOpacity={0.1}
					thickness={2}
					curved
					xAxisColor="#E5E7EB"
					yAxisColor="#E5E7EB"
					rulesColor="#F3F4F6"
					noOfSections={4}
					yAxisTextStyle={styles.axisText}
					xAxisLabelTextStyle={styles.axisText}
					xAxisTextNumberOfLines={1}
					hideDataPoints={false}
					initialSpacing={16}
					endSpacing={16}
					dataPointsHeight={7}
					dataPointsWidth={10}
					dataPointsRadius={4}
					focusedDataPointColor={resolvedLineColor}
					focusedDataPointRadius={5}
					pointerConfig={{
						showPointerStrip: true,
						pointerStripColor: '#E5E7EB',
						pointerStripWidth: 2,
						pointerColor: resolvedLineColor,
						radius: 4,
						autoAdjustPointerLabelPosition: true,
						pointerLabelWidth: 110,
						pointerLabelHeight: 44,
						pointerLabelComponent: (
							items: any[],
							_secondary: any,
							pointerIndex: number,
						) => {
							const first = items && items.length > 0 ? items[0] : undefined;
							if (!first) return null;

							const isFirst = pointerIndex === 0;
							const isLast = pointerIndex === data.length - 1;

							return (
								<View
									style={[
										styles.tooltipContainer,
										isFirst && styles.tooltipAlignLeft,
										isLast && styles.tooltipAlignRight,
									]}
								>
									<Text style={styles.tooltipValue}>{first.value}</Text>
									{first.label ? (
										<Text
											style={styles.tooltipLabel}
											numberOfLines={1}
											ellipsizeMode="tail"
										>
											{first.label}
										</Text>
									) : null}
								</View>
							);
						},
					}}
					adjustToWidth={false}
				/>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		borderRadius: 12,
		backgroundColor: '#fff',
		padding: 12,
	},
	title: {
		fontSize: 16,
		fontWeight: '700',
		color: '#111827',
		marginBottom: 4,
	},
	chartWrapper: {
		paddingTop: 12,
	},
	axisText: {
		color: '#6B7280',
		fontSize: 11,
	},
	emptyState: {
		height: 120,
		alignItems: 'center',
		justifyContent: 'center',
	},
	emptyText: {
		color: '#9CA3AF',
		fontSize: 13,
	},
	tooltipContainer: {
		minWidth: 70,
		maxWidth: 110,
		backgroundColor: '#111827',
		borderRadius: 8,
		paddingVertical: 4,
		paddingHorizontal: 8,
		alignItems: 'center',
		justifyContent: 'center',
	},
	tooltipAlignLeft: {
		alignItems: 'flex-start',
	},
	tooltipAlignRight: {
		alignItems: 'flex-end',
	},
	tooltipValue: {
		color: '#FFFFFF',
		fontSize: 12,
		fontWeight: '700',
	},
	tooltipLabel: {
		color: '#D1D5DB',
		fontSize: 10,
		marginTop: 2,
	},
});
