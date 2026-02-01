import { useKeyboard, useTerminalDimensions } from "@opentui/solid"
import { createStore } from "solid-js/store"
import { useTheme, selectedForeground } from "@tui/context/theme"
import { useDialog, type DialogContext } from "@tui/ui/dialog"
import { TextAttributes, RGBA, ScrollBoxRenderable } from "@opentui/core"
import { Show, For, onMount, createMemo, createEffect } from "solid-js"
import { useSync } from "@tui/context/sync"
import { useLocal } from "@tui/context/local"

type TabId = "agents" | "teams" | "workflows"

const TABS: { id: TabId; label: string }[] = [
  { id: "agents", label: "Agents" },
  { id: "teams", label: "Teams" },
  { id: "workflows", label: "Workflows" },
]

export function DialogAgno() {
  const dialog = useDialog()
  const { theme } = useTheme()
  const sync = useSync()
  const local = useLocal()
  const [store, setStore] = createStore({
    activeTab: "agents" as TabId,
    searchQuery: "",
    selectedIndex: 0,
    selectedAgent: null as { id: string; name: string } | null,
  })

  // Create agents memo from sync provider data
  const agents = createMemo(() => {
    const agentosProvider = sync.data.provider.find((p) => p.id === "agentos")
    if (!agentosProvider) return []

    const currentModel = local.model.current()
    const connectedAgentId =
      currentModel?.providerID === "agentos" ? currentModel.modelID : null

    // Extract agents from models
    const agentList = Object.entries(agentosProvider.models).map(([id, model]) => ({
      id,
      name: model.name,
      isConnected: id === connectedAgentId,
    }))

    // Sort: connected first, then alphabetically
    return agentList.sort((a, b) => {
      if (a.isConnected && !b.isConnected) return -1
      if (!a.isConnected && b.isConnected) return 1
      return a.name.localeCompare(b.name)
    })
  })

  // Create filtered agents memo
  const filteredAgents = createMemo(() => {
    const allAgents = agents()
    if (!store.searchQuery.trim()) return allAgents
    const query = store.searchQuery.toLowerCase()
    return allAgents.filter((agent) => agent.name.toLowerCase().includes(query))
  })

  // Calculate list height based on terminal dimensions
  const dimensions = useTerminalDimensions()
  const height = createMemo(() =>
    Math.min(filteredAgents().length, Math.floor(dimensions().height / 2) - 8),
  )

  // Initialize selectedIndex to connected agent on mount
  createEffect(() => {
    const agentList = filteredAgents()
    const connectedIndex = agentList.findIndex((a) => a.isConnected)
    if (connectedIndex >= 0) {
      setStore("selectedIndex", connectedIndex)
    }
  })

  let scrollRef: ScrollBoxRenderable | undefined

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

    // Handle agent list navigation when on agents tab and not in detail view
    if (store.activeTab === "agents" && store.selectedAgent === null) {
      if (evt.name === "up" || (evt.ctrl && evt.name === "p")) {
        const agentList = filteredAgents()
        if (agentList.length === 0) return
        let next = store.selectedIndex - 1
        if (next < 0) next = agentList.length - 1
        setStore("selectedIndex", next)
        scrollToSelected()
        evt.preventDefault()
      }
      if (evt.name === "down" || (evt.ctrl && evt.name === "n")) {
        const agentList = filteredAgents()
        if (agentList.length === 0) return
        let next = store.selectedIndex + 1
        if (next >= agentList.length) next = 0
        setStore("selectedIndex", next)
        scrollToSelected()
        evt.preventDefault()
      }
      // Enter = quick connect to selected agent
      if (evt.name === "return") {
        const agentList = filteredAgents()
        const selectedAgent = agentList[store.selectedIndex]
        if (selectedAgent) {
          local.model.set({ providerID: "agentos", modelID: selectedAgent.id }, { recent: true })
          dialog.clear()
          evt.preventDefault()
        }
      }
      // Ctrl+L = view details (read-only)
      if (evt.ctrl && evt.name === "l") {
        const agentList = filteredAgents()
        const selectedAgent = agentList[store.selectedIndex]
        if (selectedAgent) {
          setStore("selectedAgent", { id: selectedAgent.id, name: selectedAgent.name })
          evt.preventDefault()
        }
      }
    }
  })

  function scrollToSelected() {
    if (!scrollRef) return
    const agentList = filteredAgents()
    const target = scrollRef.getChildren().find((child) => {
      const index = Number(child.id)
      return !isNaN(index) && index === store.selectedIndex
    })
    if (!target) return
    const y = target.y - scrollRef.y
    if (y >= scrollRef.height) {
      scrollRef.scrollBy(y - scrollRef.height + 1)
    }
    if (y < 0) {
      scrollRef.scrollBy(y)
    }
  }

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
          <Show
            when={!store.selectedAgent}
            fallback={
              <AgentDetail
                agent={store.selectedAgent!}
                onBack={() => setStore("selectedAgent", null)}
              />
            }
          >
            <Show
              when={filteredAgents().length > 0}
              fallback={<text fg={theme.textMuted}>No agents found</text>}
            >
              <scrollbox
                ref={(r: ScrollBoxRenderable) => (scrollRef = r)}
                maxHeight={height()}
                scrollbarOptions={{ visible: false }}
              >
                <For each={filteredAgents()}>
                  {(agent, index) => (
                    <AgentRow
                      id={String(index())}
                      agent={agent}
                      active={index() === store.selectedIndex}
                      onSelect={() => {
                        // Click = quick connect (same as Enter)
                        local.model.set({ providerID: "agentos", modelID: agent.id }, { recent: true })
                        dialog.clear()
                      }}
                      onHover={() => setStore("selectedIndex", index())}
                    />
                  )}
                </For>
              </scrollbox>
            </Show>
          </Show>
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
        <Show when={store.activeTab === "agents" && !store.selectedAgent}>
          <text fg={theme.textMuted}>
            <span style={{ fg: theme.text }}>Enter</span> connect
          </text>
          <text fg={theme.textMuted}>
            <span style={{ fg: theme.text }}>Ctrl+L</span> details
          </text>
        </Show>
        <text fg={theme.textMuted}>
          <span style={{ fg: theme.text }}>Tab</span> switch section
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

function AgentRow(props: {
  id: string
  agent: { id: string; name: string; isConnected: boolean }
  active: boolean
  onSelect: () => void
  onHover: () => void
}) {
  const { theme } = useTheme()
  const fg = selectedForeground(theme)

  return (
    <box
      id={props.id}
      flexDirection="row"
      backgroundColor={props.active ? theme.primary : RGBA.fromInts(0, 0, 0, 0)}
      paddingLeft={props.agent.isConnected ? 1 : 3}
      paddingRight={3}
      gap={1}
      onMouseOver={props.onHover}
      onMouseUp={props.onSelect}
    >
      <Show when={props.agent.isConnected}>
        <text flexShrink={0} fg={props.active ? fg : theme.primary}>
          ●
        </text>
      </Show>
      <text
        flexGrow={1}
        fg={props.active ? fg : props.agent.isConnected ? theme.primary : theme.text}
        attributes={props.active ? TextAttributes.BOLD : undefined}
      >
        {props.agent.name}
      </text>
    </box>
  )
}

function AgentDetail(props: { agent: { id: string; name: string }; onBack: () => void }) {
  const { theme } = useTheme()
  const sync = useSync()
  const local = useLocal()

  // Get full model data from provider
  const model = createMemo(() => {
    const provider = sync.data.provider.find((p) => p.id === "agentos")
    return provider?.models[props.agent.id]
  })

  const isConnected = createMemo(() => {
    const current = local.model.current()
    return current?.providerID === "agentos" && current?.modelID === props.agent.id
  })

  const metadata = createMemo(
    () =>
      model()?.options.agentMetadata as
        | {
            description: string | null
            role: string | null
            model: { name: string; model: string; provider: string } | null
          }
        | undefined,
  )

  useKeyboard((evt) => {
    // Ctrl+B goes back to agent list
    if (evt.ctrl && evt.name === "b") {
      props.onBack()
      evt.preventDefault()
    }
  })

  return (
    <box flexDirection="column" gap={1}>
      {/* Agent name */}
      <text fg={theme.text} attributes={TextAttributes.BOLD}>
        {model()?.name || props.agent.name}
      </text>

      {/* Status */}
      <box flexDirection="row" gap={1}>
        <text flexShrink={0} fg={isConnected() ? theme.success : theme.textMuted}>
          {"\u2022"}
        </text>
        <text fg={theme.text}>
          {isConnected() ? "Connected" : "Available"}
        </text>
      </box>

      {/* Model info */}
      <Show when={metadata()?.model}>
        <text fg={theme.textMuted}>
          Model: {metadata()!.model!.model} ({metadata()!.model!.provider})
        </text>
      </Show>

      {/* Tools */}
      <text fg={theme.textMuted}>
        Tools: {model()?.capabilities?.toolcall ? "Available" : "None"}
      </text>

      {/* Description */}
      <Show when={metadata()?.description}>
        <text fg={theme.textMuted} wrapMode="word">
          {metadata()!.description}
        </text>
      </Show>

      {/* Actions hint */}
      <box flexDirection="row" gap={3} paddingTop={1}>
        <text fg={theme.textMuted}>
          <span style={{ fg: theme.text }}>Ctrl+B</span> back
        </text>
      </box>
    </box>
  )
}
