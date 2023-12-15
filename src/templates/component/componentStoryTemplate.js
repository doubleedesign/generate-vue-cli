import * as TemplateNameComponent from './TemplateName.vue';

const TemplateName = (args) => ({
	components: { TemplateNameComponent },
	setup() {
		return { args };
	},
	template: '<template-name v-bind="args" />',
});

export const Primary = TemplateName.bind({});
Primary.args = {};
