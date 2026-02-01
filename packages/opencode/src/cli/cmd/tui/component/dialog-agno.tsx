import { useKeyboard } from "@opentui/solid"
import { createStore } from "solid-js/store"
import { useTheme } from "@tui/context/theme"
import { useDialog, type DialogContext } from "@tui/ui/dialog"
import { TextAttributes } from "@opentui/core"
import { Show, For, onMount } from "solid-js"

type TabId = "agents" | "teams" | "workflows"

const TABS: { id: TabId; label: string }[] = [
  { id: "agents", label: "Agents" },
  { id: "teams", label: "Teams" },
  { id: "workflows", label: "Workflows" },
]

export function DialogAgno() {
  const dialog = useDialog()
  const { theme } = useTheme()
  const [store, setStore] = createStore({
    activeTab: "agents" as TabId,
    searchQuery: "",
  })

  onMount(() => {
    dialog.setSize("medium")
  })

  useKeyboard((evt) => {
    if (evt.name === "tab") {
      const currentIndex = TABS.findIndex((t) => t.id === store.activeTab)
      const nextIndex = (currentIndex + 1) % TABS.length
      setStore("activeTab", TABS[nextIndex].id)
      evt.preventDefault()
    }
  })

  return (
    <box gap={1} paddingBottom={1}>
      {/* Header with title and esc hint */}
      <box paddingLeft={4} paddingRight={4}>
        <box flexDirection="row" justifyContent="space-between">
          <text fg={theme.text} attributes={TextAttributes.BOLD}>
            AgentOS Hub
          </text>
          <text fg={theme.textMuted}>esc</text>
        </box>
      </box>

      {/* Tab bar with underline style */}
      <box paddingLeft={4} paddingRight={4}>
        <box flexDirection="row" gap={2}>
          <For each={TABS}>
            {(tab) => {
              const isActive = () => store.activeTab === tab.id
              return (
                <box
                  flexDirection="column"
                  onMouseUp={() => setStore("activeTab", tab.id)}
                >
                  <text
                    fg={isActive() ? theme.text : theme.textMuted}
                    attributes={isActive() ? TextAttributes.BOLD : undefined}
                  >
                    {tab.label}
                  </text>
                  <Show when={isActive()}>
                    <text fg={theme.primary}>{"─".repeat(tab.label.length)}</text>
                  </Show>
                  <Show when={!isActive()}>
                    <text fg={theme.textMuted}>{" ".repeat(tab.label.length)}</text>
                  </Show>
                </box>
              )
            }}
          </For>
        </box>
      </box>

      {/* Search input */}
      <box paddingLeft={4} paddingRight={4} paddingTop={1}>
        <input
          onInput={(e) => setStore("searchQuery", e)}
          focusedBackgroundColor={theme.backgroundPanel}
          cursorColor={theme.primary}
          focusedTextColor={theme.textMuted}
          placeholder="Search"
        />
      </box>

      {/* Content area based on active tab */}
      <box paddingLeft={4} paddingRight={4} paddingTop={1} minHeight={5}>
        <Show when={store.activeTab === "agents"}>
          <text fg={theme.textMuted}>Loading agents...</text>
        </Show>
        <Show when={store.activeTab === "teams"}>
          <text fg={theme.textMuted}>Coming soon</text>
        </Show>
        <Show when={store.activeTab === "workflows"}>
          <text fg={theme.textMuted}>Coming soon</text>
        </Show>
      </box>

      {/* Keyboard hints at bottom */}
      <box paddingLeft={4} paddingRight={4} flexDirection="row" gap={3} paddingTop={1}>
        <text fg={theme.textMuted}>
          <span style={{ fg: theme.text }}>Tab</span> switch section
        </text>
        <text fg={theme.textMuted}>
          <span style={{ fg: theme.text }}>Enter</span> select
        </text>
        <text fg={theme.textMuted}>
          <span style={{ fg: theme.text }}>Esc</span> close
        </text>
      </box>
    </box>
  )
}

DialogAgno.show = (dialog: DialogContext) => {
  dialog.replace(() => <DialogAgno />)
}
