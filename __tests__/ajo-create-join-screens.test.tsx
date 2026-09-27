import { act, fireEvent, render } from '@testing-library/react-native';

import { CreateGroupScreen } from '@/features/ajo/create-group-screen';
import { JoinGroupScreen } from '@/features/ajo/join-group-screen';

/** A code long enough to pass the length check the backend also applies. */
const CODE = 'a'.repeat(40);

describe('creating an Ajo group', () => {
  const setup = async (props: Partial<Parameters<typeof CreateGroupScreen>[0]> = {}) =>
    await render(<CreateGroupScreen submitting={false} onSubmit={jest.fn()} {...props} />);

  /** Fills step 1 and moves to step 2. */
  async function toMembers(view: Awaited<ReturnType<typeof setup>>) {
    await act(async () =>
      fireEvent.changeText(view.getByLabelText('Group name'), 'Eko Savings Circle'),
    );
    await act(async () => fireEvent.press(view.getByText('Continue')));
  }

  it('starts on the basics with the progress named', async () => {
    const view = await setup();
    expect(view.getByText(/STEP 1: BASICS/)).toBeTruthy();
  });

  it('will not advance past a group with no name', async () => {
    // Blocking here rather than at submit means the admin is told which field
    // is wrong while they are still looking at it.
    const view = await setup();
    await act(async () => fireEvent.press(view.getByText('Continue')));
    expect(view.getByText(/at least 3 characters/)).toBeTruthy();
    expect(view.getByText(/STEP 1: BASICS/)).toBeTruthy();
  });

  it('advances once the basics are valid', async () => {
    const view = await setup();
    await toMembers(view);
    expect(view.getByText(/STEP 2: MEMBERS/)).toBeTruthy();
  });

  it('offers both group types', async () => {
    const view = await setup();
    expect(view.getByLabelText('Fixed Amount. Everyone pays the same')).toBeTruthy();
    expect(
      view.getByLabelText('Variable Amount. Members contribute different amounts'),
    ).toBeTruthy();
  });

  it('marks the chosen type as selected, not merely coloured', async () => {
    const view = await setup();
    const variable = view.getByLabelText('Variable Amount. Members contribute different amounts');
    await act(async () => fireEvent.press(variable));
    expect(variable.props.accessibilityState.selected).toBe(true);
  });

  it('names the duration in the unit the frequency implies', async () => {
    const view = await setup();
    expect(view.getByText(/DURATION — 12 months/)).toBeTruthy();
  });

  it('steps the member count without a keyboard', async () => {
    const view = await setup();
    await toMembers(view);

    expect(view.getByLabelText('Maximum members, 20 members')).toBeTruthy();
    await act(async () => fireEvent.press(view.getByLabelText('More members')));
    expect(view.getByLabelText('Maximum members, 21 members')).toBeTruthy();
  });

  it('warns when the rotation is too short to pay everyone', async () => {
    // Twenty positions on a twelve-month monthly rotation pays twelve people
    // and leaves eight contributing towards a turn that never comes.
    const view = await setup();
    await toMembers(view);
    expect(view.getByText(/shorter than its member count/)).toBeTruthy();
  });

  it('drops the warning once the rotation can cover its members', async () => {
    const view = await setup();
    await toMembers(view);
    for (let index = 0; index < 8; index += 1) {
      await act(async () => fireEvent.press(view.getByLabelText('Fewer members')));
    }
    expect(view.queryByText(/shorter than its member count/)).toBeNull();
  });

  it('hides the positions field until multiple slots are allowed', async () => {
    const view = await setup();
    await toMembers(view);
    expect(view.queryByLabelText('Positions you are taking')).toBeNull();

    await act(async () =>
      fireEvent(
        view.getByLabelText('Multiple Slots. Members hold multiple positions'),
        'valueChange',
        true,
      ),
    );
    expect(view.getByLabelText('Positions you are taking')).toBeTruthy();
  });

  it('submits the terms it showed on the review step', async () => {
    const onSubmit = jest.fn();
    const view = await setup({ onSubmit });
    await toMembers(view);
    for (let index = 0; index < 8; index += 1) {
      await act(async () => fireEvent.press(view.getByLabelText('Fewer members')));
    }
    await act(async () => fireEvent.press(view.getByText('Continue')));

    await act(async () =>
      fireEvent.changeText(view.getByLabelText('Contribution per slot (₦)'), '25000'),
    );
    await act(async () => fireEvent.press(view.getByText('Continue')));

    expect(view.getByText(/STEP 4: REVIEW/)).toBeTruthy();
    expect(view.getByText('Eko Savings Circle')).toBeTruthy();
    expect(view.getByLabelText('Max members: 12')).toBeTruthy();

    await act(async () => fireEvent.press(view.getByText('Launch Group')));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Eko Savings Circle',
        maxSlots: 12,
        baseContributionMinor: '2500000',
        contributionFrequency: 'MONTHLY',
        gracePeriodMinutes: 4320,
      }),
    );
  });

  it('says plainly that a group cannot set its own fee', async () => {
    // The design has a Fees step the backend cannot store, so rather than
    // collect numbers and discard them the review says what is true.
    const view = await setup();
    await toMembers(view);
    for (let index = 0; index < 8; index += 1) {
      await act(async () => fireEvent.press(view.getByLabelText('Fewer members')));
    }
    await act(async () => fireEvent.press(view.getByText('Continue')));
    await act(async () =>
      fireEvent.changeText(view.getByLabelText('Contribution per slot (₦)'), '25000'),
    );
    await act(async () => fireEvent.press(view.getByText('Continue')));

    expect(view.getByText(/does not charge this group a fee/)).toBeTruthy();
  });
});

describe('joining an Ajo group', () => {
  const setup = async (props: Partial<Parameters<typeof JoinGroupScreen>[0]> = {}) =>
    await render(
      <JoinGroupScreen
        submitting={false}
        verifying={false}
        onVerify={jest.fn()}
        onSubmit={jest.fn()}
        {...props}
      />,
    );

  it('asks for the code before anything else', async () => {
    const view = await setup();
    expect(view.getByText('Verify code')).toBeTruthy();
    expect(view.queryByText('Join group')).toBeNull();
  });

  it('will not spend a request on a code that is obviously too short', async () => {
    const onVerify = jest.fn();
    const view = await setup({ onVerify });
    await act(async () => fireEvent.changeText(view.getByLabelText('Invitation code'), 'abc'));
    await act(async () => fireEvent.press(view.getByText('Verify code')));
    expect(onVerify).not.toHaveBeenCalled();
    // The button stays tappable so the refusal is stated, not silent.
    expect(view.getByText(/doesn’t look like an invitation code/)).toBeTruthy();
  });

  it('verifies a short code as retyped, in its canonical form', async () => {
    const onVerify = jest.fn();
    const view = await setup({ onVerify });
    await act(async () =>
      fireEvent.changeText(view.getByLabelText('Invitation code'), 'whe4-ntdh27'),
    );
    await act(async () => fireEvent.press(view.getByText('Verify code')));
    expect(onVerify).toHaveBeenCalledWith('WHE4NTDH27');
  });

  it('verifies a code that could plausibly be one', async () => {
    const onVerify = jest.fn();
    const view = await setup({ onVerify });
    await act(async () => fireEvent.changeText(view.getByLabelText('Invitation code'), CODE));
    await act(async () => fireEvent.press(view.getByText('Verify code')));
    expect(onVerify).toHaveBeenCalledWith(CODE);
  });

  it('verifies the code inside a pasted invitation message', async () => {
    // The admin shares a message with the link and the code, not the bare
    // code; pasting all of it must still verify.
    const onVerify = jest.fn();
    const view = await setup({ onVerify });
    await act(async () =>
      fireEvent.changeText(
        view.getByLabelText('Invitation code'),
        'Join "Eko Savings Circle" on Ajo Cloud.\nhttps://ajocloud.com/g/whe4-ntdh27\nInvitation code: whe4-ntdh27',
      ),
    );
    await act(async () => fireEvent.press(view.getByText('Verify code')));
    expect(onVerify).toHaveBeenCalledWith('WHE4NTDH27');
  });

  it('verifies a pasted bare link', async () => {
    const onVerify = jest.fn();
    const view = await setup({ onVerify });
    await act(async () =>
      fireEvent.changeText(view.getByLabelText('Invitation code'), 'ajocloud://g/whe4-ntdh27'),
    );
    await act(async () => fireEvent.press(view.getByText('Verify code')));
    expect(onVerify).toHaveBeenCalledWith('WHE4NTDH27');
  });

  it('names the group before asking anyone to commit to it', async () => {
    // A code read aloud or forwarded is easy to get wrong, and joining the
    // wrong rotation is a commitment of real money.
    const view = await setup({
      resolved: { groupId: 'group-1', groupName: 'Eko Savings Circle' },
    });
    expect(view.getByText('Eko Savings Circle')).toBeTruthy();
    expect(view.getByText('Join group')).toBeTruthy();
  });

  it('takes one position unless more are asked for', async () => {
    const onSubmit = jest.fn();
    const view = await setup({
      resolved: { groupId: 'group-1', groupName: 'Eko Savings Circle' },
      initialInvitationCode: CODE,
      onSubmit,
    });

    await act(async () => fireEvent.press(view.getByText('Join group')));
    expect(onSubmit).toHaveBeenCalledWith({
      groupId: 'group-1',
      invitationCode: CODE,
      requestedSlots: 1,
    });
  });

  it('takes several positions once that is turned on', async () => {
    const onSubmit = jest.fn();
    const view = await setup({
      resolved: { groupId: 'group-1', groupName: 'Eko Savings Circle' },
      initialInvitationCode: CODE,
      onSubmit,
    });

    await act(async () =>
      fireEvent(
        view.getByLabelText('Take more than one position. Hold several positions in the rotation'),
        'valueChange',
        true,
      ),
    );
    await act(async () => fireEvent.press(view.getByLabelText('More positions')));
    await act(async () => fireEvent.press(view.getByText('Join group')));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ requestedSlots: 2 }));
  });

  it('moves from the code step to the confirm step', async () => {
    const view = await setup();
    expect(view.getByText('Verify code')).toBeTruthy();
    expect(view.queryByText('Join group')).toBeNull();

    const confirmed = await setup({
      resolved: { groupId: 'group-1', groupName: 'Eko Savings Circle' },
    });
    expect(confirmed.getByText('Join group')).toBeTruthy();
  });

  it('goes back to the code without forgetting it', async () => {
    const view = await setup({
      resolved: { groupId: 'group-1', groupName: 'Eko Savings Circle' },
      initialInvitationCode: CODE,
    });

    await act(async () => fireEvent.press(view.getByText('Back')));
    expect(view.getByText('Verify code')).toBeTruthy();
    expect(view.getByDisplayValue(CODE)).toBeTruthy();
  });

  it('does not spend a second request continuing with an unchanged code', async () => {
    const onVerify = jest.fn();
    const view = await setup({
      resolved: { groupId: 'group-1', groupName: 'Eko Savings Circle' },
      initialInvitationCode: CODE,
      onVerify,
    });

    await act(async () => fireEvent.press(view.getByText('Back')));
    await act(async () => fireEvent.press(view.getByText('Verify code')));

    expect(onVerify).not.toHaveBeenCalled();
    expect(view.getByText('Join group')).toBeTruthy();
  });

  it('states the terms from the invitation preview before asking for commitment', async () => {
    const view = await setup({
      resolved: {
        groupId: 'group-1',
        groupName: 'Eko Savings Circle',
        preview: {
          groupName: 'Eko Savings Circle',
          inviterName: 'Adaeze Okafor',
          contributionAmountMinor: '2500000',
          currency: 'NGN',
          contributionFrequency: 'MONTHLY',
          memberCount: 8,
          maxMembers: 12,
          expiresAt: null,
        },
      },
    });

    expect(view.getByText('YOU ARE JOINING')).toBeTruthy();
    expect(view.getByText(/₦25,000\.00 every month/)).toBeTruthy();
    expect(view.getByText(/8 joined · 4 spots left/)).toBeTruthy();
    expect(view.getByLabelText('Invited by: Adaeze Okafor')).toBeTruthy();
  });

  it('still joins with the name alone when no preview exists', async () => {
    // A legacy code may verify without a public preview; joining must not
    // wait on decoration.
    const view = await setup({
      resolved: { groupId: 'group-1', groupName: 'Eko Savings Circle' },
    });

    expect(view.getByText('YOU ARE JOINING')).toBeTruthy();
    expect(view.getByText('Join group')).toBeTruthy();
    expect(view.queryByText(/Invited by/)).toBeNull();
  });

  it('opens straight on confirm with no way back when the code arrived locked', async () => {
    // From an invitation link the group was already previewed on the landing
    // screen, so there is no code step to return to.
    const view = await setup({
      codeLocked: true,
      initialInvitationCode: CODE,
      resolved: { groupId: 'group-1', groupName: 'Eko Savings Circle' },
    });

    expect(view.getByText('Join group')).toBeTruthy();
    expect(view.queryByText('Back')).toBeNull();
  });
});
