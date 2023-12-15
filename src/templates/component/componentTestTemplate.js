import { render, screen } from '@testing-library/vue';
import TemplateName from './TemplateName.vue';

it('renders', async () => {
	const { element } = render(TemplateName);

	expect(screen.getByTestId('TemplateName')).toBeInTheDocument();
});
