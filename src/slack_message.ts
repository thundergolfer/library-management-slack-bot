export interface SlackMessage {
    text?: string;
    blocks?: ReadonlyArray<any>;
    response_type?: 'ephemeral',
}
