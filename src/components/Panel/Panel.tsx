import _ from 'lodash';
import React from 'react';
import PropTypes from 'react-peek/prop-types';
import { lucidClassNames } from '../../util/style-helpers';
import {
	findTypes,
	omitProps,
	FC,
	StandardProps,
} from '../../util/component-types';

const cx = lucidClassNames.bind('&-Panel');

const { bool, node, object, string } = PropTypes;

interface IPanelHeaderProps extends StandardProps {
	description?: string;
}

const PanelHeader: FC<IPanelHeaderProps> = (): null => null;
PanelHeader.displayName = 'Panel.Header';
PanelHeader.peek = {
	description: `
		Content displayed at the top of the panel.
	`,
};
PanelHeader.propTypes = {
	description: string,
	children: node,
};
PanelHeader.propName = 'Header';

interface IPanelFooterProps extends StandardProps {
	description?: string;
}
const PanelFooter: FC<IPanelFooterProps> = (): null => null;

PanelFooter.displayName = 'Panel.Footer';
PanelFooter.peek = {
	description: `
		Content displayed at the bottom of the panel.
	`,
};
PanelFooter.propTypes = {
	description: string,
	children: node,
};
PanelFooter.propName = 'Footer';

export interface IPanelProps extends StandardProps {
	/** *Child Element* - Header contents. Only one \`Header\` is used. */
	Header?: React.ReactNode & { props: IPanelHeaderProps };

	/** *Child Element* - Footer contents. Only one \`Footer\` is used. */
	Footer?: React.ReactNode & { props: IPanelFooterProps };

	/** If set to true, creates a content section with no padding. */
	isGutterless?: boolean;

	/** If set to false, removes margin around the Panel */
	hasMargin?: boolean;

	/** Styles that are passed through to root element. */
	style?: React.CSSProperties;

	/** If set to true, makes content overflow scrollable, when Panel has a set
	 * height. */
	isScrollable?: boolean;
}

export interface IPanelFC extends FC<IPanelProps> {
	Header: FC<IPanelHeaderProps>;
	Footer: FC<IPanelFooterProps>;
}

const Panel: IPanelFC = (props): React.ReactElement => {
	const {
		children,
		className,
		isGutterless = false,
		hasMargin = true,
		style,
		isScrollable = true,
		...passThroughs
	} = props;

	const headerChildProp = _.first(
		_.map(findTypes(props, Panel.Header), 'props')
	);
	const footerChildProp = _.first(
		_.map(findTypes(props, Panel.Footer), 'props')
	);

	return (
		<div
			{...omitProps<IPanelProps>(
				passThroughs,
				undefined,
				_.keys(Panel.propTypes)
			)}
			className={cx('&', className, {
				'&-is-not-gutterless': !isGutterless,
				'&-has-margin': hasMargin,
				'&-is-scrollable': isScrollable,
			})}
			style={style}
		>
			{headerChildProp ? (
				<header
					{...headerChildProp}
					className={cx('&-Header', headerChildProp.className)}
				/>
			) : null}

			<section className={cx('&-content')}>{children}</section>

			{footerChildProp ? (
				<footer
					{...footerChildProp}
					className={cx('&-Footer', footerChildProp.className)}
				/>
			) : null}
		</div>
	);
};

Panel.displayName = 'Panel';
Panel.peek = {
	description: `
		Panel is used to wrap content to better organize elements in window.
	`,
	categories: ['layout'],
};
Panel.propTypes = {
	className: string`
		Appended to the component-specific class names set on the root element.
	`,
	Header: node`
		*Child Element* - Header contents. Only one \`Header\` is used.
	`,
	Footer: node`
		*Child Element* - Footer contents. Only one \`Footer\` is used.
	`,
	children: node`
		Generally you should only have a single child element so the centering
		works correctly.
	`,
	isGutterless: bool`
		If set to true, creates a content section with no padding.
	`,
	hasMargin: bool`
		If set to false, removes margin around the Panel
	`,
	style: object`
		Styles that are passed through to root element.
	`,
	isScrollable: bool`
		If set to true, makes content overflow scrollable, when Panel has a set
		height.
	`,
};
Panel.Header = PanelHeader;
Panel.Footer = PanelFooter;

export default Panel;
