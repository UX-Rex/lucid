import _ from 'lodash';
import React from 'react';
import PropTypes from 'react-peek/prop-types';
import { lucidClassNames } from '../../util/style-helpers';
import { StandardProps, omitProps } from '../../util/component-types';
import { groupByFields } from '../../util/chart-helpers';
import * as d3Shape from 'd3-shape';
import * as d3Scale from 'd3-scale';
import * as chartConstants from '../../constants/charts';

import Point from '../Point/Point';

const cx = lucidClassNames.bind('&-Points');

const { arrayOf, func, number, object, bool, string } = PropTypes;

function isValidSeries(series: any): boolean {
	if (_.isArray(series)) {
		const last = _.last(series);
		return _.isFinite(last) || _.isDate(last);
	}

	return _.isFinite(series) || _.isDate(series);
}

export interface IPointsProps
	extends StandardProps,
		React.SVGProps<SVGGElement> {
	/** 	Takes one of the palettes exported from \`lucid.chartConstants\`.
	Available palettes:

	- \`PALETTE_7\` (default)
	- \`PALETTE_30\`
	- \`PALETTE_MONOCHROME_0_5\`
	- \`PALETTE_MONOCHROME_1_5\`
	- \`PALETTE_MONOCHROME_2_5\`
	- \`PALETTE_MONOCHROME_3_5\`
	- \`PALETTE_MONOCHROME_4_5\`
	- \`PALETTE_MONOCHROME_5_5\`
	- \`PALETTE_MONOCHROME_6_5\` */
	palette: string[];

	/** You can pass in an object if you want to map fields to
	\`lucid.chartConstants\` or custom colors:

		{
			'imps': COLOR_0,
			'rev': COLOR_3,
			'clicks': '#abc123',
		} */
	colorMap?: object;

	/** De-normalized data, e.g.

		[
			{ x: 'one'   , y: 1 },
			{ x: 'two'   , y: 2 },
			{ x: 'three' , y: 2 },
			{ x: 'four'  , y: 3 },
			{ x: 'five'  , y: 4 },
		]

	Or (be sure to set \`yFields\` to \`['y0', 'y1', 'y2', 'y3']\`)

		[
			{ x: 'one'   , y0: 1  , y1: 2 , y2: 3 , y3: 5 },
			{ x: 'two'   , y0: 2  , y1: 3 , y2: 4 , y3: 6 },
			{ x: 'three' , y0: 2  , y1: 4 , y2: 5 , y3: 6 },
			{ x: 'four'  , y0: 3  , y1: 6 , y2: 7 , y3: 7 },
			{ x: 'five'  , y0: 4  , y1: 8 , y2: 9 , y3: 8 },
			{ x: 'six'   , y0: 20 , y1: 8 , y2: 9 , y3: 1 },
		] */
	data: Array<{[key: string]: string | number }>;

	/** The scale for the x axis. Must be a d3 scale. Lucid exposes the
		`lucid.d3Scale` library for use here. */
	xScale:
		| d3Scale.ScaleBand<number | string>
		| d3Scale.ScalePoint<number | string>;

	/** The scale for the y axis. Must be a d3 scale. Lucid exposes the
		`lucid.d3Scale` library for use here. */
	yScale:
		| d3Scale.ScaleContinuousNumeric<number, number>
		| d3Scale.ScaleBand<number>
		| d3Scale.ScalePoint<number>;

	/** Typically this number can be derived from the yScale. However when we're
		\`isStacked\` we need to calculate a new domain for the yScale based on
		the sum of the data. If you need explicit control of the y max when
		stacking, pass it in here. */
	yStackedMax?: number;

	/** The field we should look up your x data by. */
	xField: string;

	/** The field(s) we should look up your y data by. Each entry represents a
		series. Your actual y data should be numeric. */
	yFields: string[];

	/** This will stack the data instead of grouping it. In order to stack the
		data we have to calculate a new domain for the y scale that is based on
		the \`sum\` of the data. */
	isStacked: boolean;

	/** Sometimes you might not want the colors to start rotating at the blue
		color, this number will be added the line index in determining which
		color the lines are. */
	colorOffset: number;

	/** Display a stroke around each of the points. */
	hasStroke: boolean;
}

const defaultProps = {
	xField: 'x',
	yFields: ['y'],
	colorOffset: 0,
	hasStroke: true,
	isStacked: false,
	palette: chartConstants.PALETTE_7,
};

export const Points = (props: IPointsProps): React.ReactElement => {
	const {
		className,
		data,
		palette,
		colorMap,
		colorOffset,
		xField,
		hasStroke,
		xScale,
		yFields,
		yStackedMax,
		isStacked,
		yScale: yScaleOriginal,
		...passThroughs
	} = props;
	// Copy the original so we can mutate it
	const yScale = yScaleOriginal.copy();

	// If we are stacked, we need to calculate a new domain based on the sum of
	// the various series' y data. One row per series.
	const transformedData = isStacked
		? d3Shape.stack().keys(yFields)(data as Array<{[key: string]: number}>)
		: groupByFields(data, yFields);

	// If we are stacked, we need to calculate a new domain based on the sum of
	// the various group's y data
	if (isStacked) {
		yScale.domain([
			yScale.domain()[0],
			yStackedMax || _.max(_.flatten(_.last(transformedData))),
		]);
	}

	return (
		<g
			{...omitProps(passThroughs, undefined, _.keys(Points.propTypes))}
			className={cx(className, '&')}
		>
			{_.map(
				transformedData,
				(d, dIndex): any[] =>
					_.map(
						d,
						(series, seriesIndex): JSX.Element | undefined => {
							if (isValidSeries(series)) {
								return (
									<Point
										key={`${seriesIndex}${dIndex}`}
										x={xScale(data[seriesIndex][xField])}
										y={yScale(_.isArray(series) ? _.last(series) : series)}
										hasStroke={hasStroke}
										kind={dIndex + colorOffset}
										color={_.get(
											colorMap,
											yFields[dIndex],
											palette[(dIndex + colorOffset) % palette.length]
										)}
									/>
								);
							}
						}
					)
			)}
		</g>
	);
};

Points.defaultProps = defaultProps;

Points.displayName = 'Points';

Points.peek = {
	description: `
		*For use within an \`svg\`*

		Put some points on that data.
	`,
	categories: ['visualizations', 'chart primitives'],
	madeFrom: ['Point'],
};

Points.propTypes = {
	className: string`
		Appended to the component-specific class names set on the root element.
	`,

	palette: arrayOf(string)`
		Takes one of the palettes exported from \`lucid.chartConstants\`.
		Available palettes:

		- \`PALETTE_7\` (default)
		- \`PALETTE_30\`
		- \`PALETTE_MONOCHROME_0_5\`
		- \`PALETTE_MONOCHROME_1_5\`
		- \`PALETTE_MONOCHROME_2_5\`
		- \`PALETTE_MONOCHROME_3_5\`
		- \`PALETTE_MONOCHROME_4_5\`
		- \`PALETTE_MONOCHROME_5_5\`
		- \`PALETTE_MONOCHROME_6_5\`
	`,

	colorMap: object`
		You can pass in an object if you want to map fields to
		\`lucid.chartConstants\` or custom colors:

		{
			'imps': COLOR_0,
			'rev': COLOR_3,
			'clicks': '#abc123',
		}
	`,

	data: arrayOf(object).isRequired`
		De-normalized data, e.g.

			[
				{ x: 'one'   , y: 1 },
				{ x: 'two'   , y: 2 },
				{ x: 'three' , y: 2 },
				{ x: 'four'  , y: 3 },
				{ x: 'five'  , y: 4 },
			]

		Or (be sure to set \`yFields\` to \`['y0', 'y1', 'y2', 'y3']\`)

			[
				{ x: 'one'   , y0: 1  , y1: 2 , y2: 3 , y3: 5 },
				{ x: 'two'   , y0: 2  , y1: 3 , y2: 4 , y3: 6 },
				{ x: 'three' , y0: 2  , y1: 4 , y2: 5 , y3: 6 },
				{ x: 'four'  , y0: 3  , y1: 6 , y2: 7 , y3: 7 },
				{ x: 'five'  , y0: 4  , y1: 8 , y2: 9 , y3: 8 },
				{ x: 'six'   , y0: 20 , y1: 8 , y2: 9 , y3: 1 },
			]
	`,

	xScale: func.isRequired`
		The scale for the x axis. Must be a d3 scale. Lucid exposes the
		\`lucid.d3Scale\` library for use here.
	`,

	yScale: func.isRequired`
		The scale for the y axis. Must be a d3 scale. Lucid exposes the
		\`lucid.d3Scale\` library for use here.
	`,

	xField: string`
		The field we should look up your x data by.
	`,

	yFields: arrayOf(string)`
		The field(s) we should look up your y data by. Each entry represents a
		series. Your actual y data should be numeric.
	`,

	yStackedMax: number`
		Typically this number can be derived from the yScale. However when we're
		\`isStacked\` we need to calculate a new domain for the yScale based on
		the sum of the data. If you need explicit control of the y max when
		stacking, pass it in here.
	`,

	colorOffset: number`
		Sometimes you might not want the colors to start rotating at the blue
		color, this number will be added the line index in determining which
		color the lines are.
	`,

	hasStroke: bool`
		Display a stroke around each of the points.
	`,

	isStacked: bool`
		This will stack the data. In order to stack the data we have to calculate
		a new domain for the y scale that is based on the \`sum\` of the data.
	`,
};

export default Points;
