module.exports = {
	root: true,
	extends: ['@das.laboratory/eslint-config-interactive-next'],
	rules: {
		'jsdoc/no-undefined-types': ['warn', { definedTypes: ['Player'] }]
	}
};
