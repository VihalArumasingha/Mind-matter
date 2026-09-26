/**
 * @format
 */

import React from 'react';
import renderer, {act} from 'react-test-renderer';

import CommunityOrganizerBadge from '../src/components/CommunityOrganizerBadge';

describe('CommunityOrganizerBadge', () => {
  it('renders the organizer badge for a community organizer role', () => {
    let tree;

    act(() => {
      tree = renderer.create(
        <CommunityOrganizerBadge role="communityOrganizer" size="small" />,
      );
    });

    expect(tree.root.findByProps({accessibilityLabel: 'Community Organizer'})).toBeTruthy();
    act(() => {
      tree.unmount();
    });
  });

  it('does not render the organizer badge for non-organizer roles', () => {
    let tree;

    act(() => {
      tree = renderer.create(
        <CommunityOrganizerBadge role="member" size="small" />,
      );
    });

    expect(tree.root.findAllByProps({accessibilityLabel: 'Community Organizer'})).toHaveLength(0);
    act(() => {
      tree.unmount();
    });
  });
});
