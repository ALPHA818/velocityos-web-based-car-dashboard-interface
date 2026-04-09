import { IndexedEntity, Entity } from "./core-utils";
import type { User, Chat, ChatMessage, UserSettings, SavedLocation, TrackingState } from "@shared/types";
import { MOCK_CHAT_MESSAGES, MOCK_CHATS, MOCK_USERS } from "@shared/mock-data";
export class UserEntity extends IndexedEntity<User> {
  static readonly entityName = "user";
  static readonly indexName = "users";
  static readonly initialState: User = { id: "", name: "" };
  static seedData = MOCK_USERS;
}
export class SettingsEntity extends IndexedEntity<UserSettings> {
  static readonly entityName = "settings";
  static readonly indexName = "all-settings";
  static readonly initialState: UserSettings = {
    id: "default",
    units: "mph",
    mapProvider: "google",
    mapTheme: "highway",
    theme: "dark",
    autoTheme: true,
    mapPerspective: "top-down",
    aiName: "nova",
    aiVoiceControlEnabled: true,
    ollamaBaseUrl: "http://127.0.0.1:11434",
    ollamaModel: "llama3.2",
    aiVoiceEnabled: true,
    aiVoiceAutoSpeak: true,
    aiVoiceName: "",
    aiVoiceLang: "en-US",
    aiVoiceRate: 1,
    aiVoicePitch: 1,
    aiVoiceVolume: 1,
  };
}
export class LocationEntity extends IndexedEntity<SavedLocation> {
  static readonly entityName = "location";
  static readonly indexName = "locations";
  static readonly initialState: SavedLocation = {
    id: "",
    label: "",
    address: "",
    lat: 0,
    lon: 0,
    category: "favorite"
  };
}
export interface GenericListState<T> {
  items: T[];
}
export class RecentHistoryEntity extends Entity<GenericListState<SavedLocation>> {
  static readonly entityName = "recent-history";
  static readonly initialState: GenericListState<SavedLocation> = { items: [] };
}
export class SearchHistoryEntity extends Entity<GenericListState<SavedLocation>> {
  static readonly entityName = "search-history";
  static readonly initialState: GenericListState<SavedLocation> = { items: [] };
}
export class TrackingEntity extends Entity<TrackingState> {
  static readonly entityName = "tracking";
  static readonly initialState: TrackingState = {
    lat: 0,
    lon: 0,
    speed: 0,
    heading: 0,
    lastUpdate: 0,
    startedAt: 0,
    durationMs: 0,
    distanceKm: 0,
    path: [],
  };
}
export type ChatBoardState = Chat & { messages: ChatMessage[] };
const SEED_CHAT_BOARDS: ChatBoardState[] = MOCK_CHATS.map(c => ({
  ...c,
  messages: MOCK_CHAT_MESSAGES.filter(m => m.chatId === c.id),
}));
export class ChatBoardEntity extends IndexedEntity<ChatBoardState> {
  static readonly entityName = "chat";
  static readonly indexName = "chats";
  static readonly initialState: ChatBoardState = { id: "", title: "", messages: [] };
  static seedData = SEED_CHAT_BOARDS;
  async listMessages(): Promise<ChatMessage[]> {
    const { messages } = await this.getState();
    return messages;
  }
  async sendMessage(userId: string, text: string): Promise<ChatMessage> {
    const msg: ChatMessage = { id: crypto.randomUUID(), chatId: this.id, userId, text, ts: Date.now() };
    await this.mutate(s => ({ ...s, messages: [...s.messages, msg] }));
    return msg;
  }
}