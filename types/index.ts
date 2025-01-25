export type SupabasePresenceState = Record<string, Array<UserStatus>>

export type UserStatus = {
  online_at: string;
  peer_id: string;
  presence_ref?: string;
}