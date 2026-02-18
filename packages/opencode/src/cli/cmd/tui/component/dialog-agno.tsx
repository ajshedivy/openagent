import { useKeyboard, useTerminalDimensions } from "@opentui/solid"
import { createStore } from "solid-js/store"
import { useTheme, selectedForeground } from "@tui/context/theme"
import { useDialog, type DialogContext } from "@tui/ui/dialog"
import { TextAttributes, RGBA, ScrollBoxRenderable } from "@opentui/core"
import { Show, For, onMount, createMemo, createEffect, createSignal } from "solid-js"
import { useSync } from "@tui/context/sync"
import { useLocal } from "@tui/context/local"
import { useSDK } from "@tui/context/sdk"

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
  const sdk = useSDK()
  const [isRefreshing, setIsRefreshing] = createSignal(false)

  async function handleRefresh() {
    if (isRefreshing()) return
    setIsRefreshing(true)
    try {
      await sdk.client.instance.dispose()
      await sync.bootstrap()
    } finally {
      setIsRefreshing(false)
    }
  }

  const [store, setStore] = createStore({
    activeTab: "agents" as TabId,
    selectedIndex: 0,
    selectedAgent: null as { id: string; name: string } | null,
    selectedTeamIndex: 0,
    selectedTeam: null as { id: string; name: string } | null,
  })

  // Create agents memo from sync provider data (exclude teams)
  const agents = createMemo(() => {
    const agentosProvider = sync.data.provider.find((p) => p.id === "agentos")
    if (!agentosProvider) return []

    const currentModel = local.model.current()
    const connectedAgentId =
      currentModel?.providerID === "agentos" ? currentModel.modelID : null

    const agentList = Object.entries(agentosProvider.models)
      .filter(([, model]) => !model.options.isTeam)
      .map(([id, model]) => ({
        id,
        name: model.name,
        isConnected: id === connectedAgentId,
      }))

    return agentList.sort((a, b) => {
      if (a.isConnected && !b.isConnected) return -1
      if (!a.isConnected && b.isConnected) return 1
      return a.name.localeCompare(b.name)
    })
  })

  // Create teams memo from sync provider data
  const teams = createMemo(() => {
    const agentosProvider = sync.data.provider.find((p) => p.id === "agentos")
    if (!agentosProvider) return []

    const currentModel = local.model.current()
    const connectedModelId =
      currentModel?.providerID === "agentos" ? currentModel.modelID : null

    const teamList = Object.entries(agentosProvider.models)
      .filter(([, model]) => model.options.isTeam === true)
      .map(([id, model]) => {
        const meta = model.options.teamMetadata as {
          description?: string | null
          members?: { id?: string | null; name?: string | null }[]
        } | undefined
        return {
          id,
          name: model.name,
          memberCount: meta?.members?.length ?? 0,
          isConnected: id === connectedModelId,
        }
      })

    return teamList.sort((a, b) => {
      if (a.isConnected && !b.isConnected) return -1
      if (!a.isConnected && b.isConnected) return 1
      return a.name.localeCompare(b.name)
    })
  })

  // Calculate list height based on terminal dimensions
  const dimensions = useTerminalDimensions()
  const agentHeight = createMemo(() =>
    Math.min(agents().length, Math.floor(dimensions().height / 2) - 8),
  )
  const teamHeight = createMemo(() =>
    Math.min(teams().length, Math.floor(dimensions().height / 2) - 8),
  )

  // Initialize selectedIndex to connected agent on mount
  createEffect(() => {
    const agentList = agents()
    const connectedIndex = agentList.findIndex((a) => a.isConnected)
    if (connectedIndex >= 0) {
      setStore("selectedIndex", connectedIndex)
    }
  })

  // Initialize selectedTeamIndex to connected team
  createEffect(() => {
    const teamList = teams()
    const connectedIndex = teamList.findIndex((t) => t.isConnected)
    if (connectedIndex >= 0) {
      setStore("selectedTeamIndex", connectedIndex)
    }
  })

  let scrollRef: ScrollBoxRenderable | undefined
  let teamScrollRef: ScrollBoxRenderable | undefined

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

    // Ctrl+R = refresh/reconnect to AgentOS server
    if (evt.ctrl && evt.name === "r") {
      handleRefresh()
      evt.preventDefault()
    }

    // Handle agent list navigation when on agents tab and not in detail view
    if (store.activeTab === "agents" && store.selectedAgent === null) {
      if (evt.name === "up" || (evt.ctrl && evt.name === "p")) {
        const agentList = agents()
        if (agentList.length === 0) return
        let next = store.selectedIndex - 1
        if (next < 0) next = agentList.length - 1
        setStore("selectedIndex", next)
        scrollToSelected(scrollRef, store.selectedIndex)
        evt.preventDefault()
      }
      if (evt.name === "down" || (evt.ctrl && evt.name === "n")) {
        const agentList = agents()
        if (agentList.length === 0) return
        let next = store.selectedIndex + 1
        if (next >= agentList.length) next = 0
        setStore("selectedIndex", next)
        scrollToSelected(scrollRef, store.selectedIndex)
        evt.preventDefault()
      }
      if (evt.name === "return") {
        const agentList = agents()
        const selectedAgent = agentList[store.selectedIndex]
        if (selectedAgent) {
          local.model.set({ providerID: "agentos", modelID: selectedAgent.id }, { recent: true })
          dialog.clear()
          evt.preventDefault()
        }
      }
      if (evt.ctrl && evt.name === "l") {
        const agentList = agents()
        const selectedAgent = agentList[store.selectedIndex]
        if (selectedAgent) {
          setStore("selectedAgent", { id: selectedAgent.id, name: selectedAgent.name })
          evt.preventDefault()
        }
      }
    }

    // Handle team list navigation when on teams tab and not in detail view
    if (store.activeTab === "teams" && store.selectedTeam === null) {
      if (evt.name === "up" || (evt.ctrl && evt.name === "p")) {
        const teamList = teams()
        if (teamList.length === 0) return
        let next = store.selectedTeamIndex - 1
        if (next < 0) next = teamList.length - 1
        setStore("selectedTeamIndex", next)
        scrollToSelected(teamScrollRef, store.selectedTeamIndex)
        evt.preventDefault()
      }
      if (evt.name === "down" || (evt.ctrl && evt.name === "n")) {
        const teamList = teams()
        if (teamList.length === 0) return
        let next = store.selectedTeamIndex + 1
        if (next >= teamList.length) next = 0
        setStore("selectedTeamIndex", next)
        scrollToSelected(teamScrollRef, store.selectedTeamIndex)
        evt.preventDefault()
      }
      if (evt.name === "return") {
        const teamList = teams()
        const selectedTeam = teamList[store.selectedTeamIndex]
        if (selectedTeam) {
          local.model.set({ providerID: "agentos", modelID: selectedTeam.id }, { recent: true })
          dialog.clear()
          evt.preventDefault()
        }
      }
      if (evt.ctrl && evt.name === "l") {
        const teamList = teams()
        const selectedTeam = teamList[store.selectedTeamIndex]
        if (selectedTeam) {
          setStore("selectedTeam", { id: selectedTeam.id, name: selectedTeam.name })
          evt.preventDefault()
        }
      }
    }
  })

  function scrollToSelected(ref: ScrollBoxRenderable | undefined, selectedIndex: number) {
    if (!ref) return
    const target = ref.getChildren().find((child) => {
      const index = Number(child.id)
      return !isNaN(index) && index === selectedIndex
    })
    if (!target) return
    const y = target.y - ref.y
    if (y >= ref.height) {
      ref.scrollBy(y - ref.height + 1)
    }
    if (y < 0) {
      ref.scrollBy(y)
    }
  }

  return (
    <box gap={1} paddingBottom={1}>
      {/* Header with title and esc hint */}
      <box paddingLeft={4} paddingRight={4}>
        <box flexDirection="row" justifyContent="space-between">
          <box flexDirection="row" gap={2} alignItems="center">
            <text fg={theme.text} attributes={TextAttributes.BOLD}>
              AgentOS Hub
            </text>
            <Show when={isRefreshing()}>
              <text fg={theme.textMuted}>Refreshing...</text>
            </Show>
          </box>
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

      {/* Content area based on active tab */}
      <box paddingLeft={4} paddingRight={4} minHeight={5}>
        <Show when={store.activeTab === "agents"}>
          <Show
            when={!store.selectedAgent}
            fallback={
              <AgentDetail
                agent={store.selectedAgent!}
                onBack={() => setStore("selectedAgent", null)}
                onConnect={() => {
                  local.model.set(
                    { providerID: "agentos", modelID: store.selectedAgent!.id },
                    { recent: true },
                  )
                  dialog.clear()
                }}
              />
            }
          >
            <Show
              when={agents().length > 0}
              fallback={<text fg={theme.textMuted}>No agents found</text>}
            >
              <scrollbox
                ref={(r: ScrollBoxRenderable) => (scrollRef = r)}
                maxHeight={agentHeight()}
                scrollbarOptions={{ visible: false }}
              >
                <For each={agents()}>
                  {(agent, index) => (
                    <AgentRow
                      id={String(index())}
                      agent={agent}
                      active={index() === store.selectedIndex}
                      onSelect={() => {
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
          <Show
            when={!store.selectedTeam}
            fallback={
              <TeamDetail
                team={store.selectedTeam!}
                onBack={() => setStore("selectedTeam", null)}
                onConnect={() => {
                  local.model.set(
                    { providerID: "agentos", modelID: store.selectedTeam!.id },
                    { recent: true },
                  )
                  dialog.clear()
                }}
              />
            }
          >
            <Show
              when={teams().length > 0}
              fallback={<text fg={theme.textMuted}>No teams found</text>}
            >
              <scrollbox
                ref={(r: ScrollBoxRenderable) => (teamScrollRef = r)}
                maxHeight={teamHeight()}
                scrollbarOptions={{ visible: false }}
              >
                <For each={teams()}>
                  {(team, index) => (
                    <TeamRow
                      id={String(index())}
                      team={team}
                      active={index() === store.selectedTeamIndex}
                      onSelect={() => {
                        local.model.set({ providerID: "agentos", modelID: team.id }, { recent: true })
                        dialog.clear()
                      }}
                      onHover={() => setStore("selectedTeamIndex", index())}
                    />
                  )}
                </For>
              </scrollbox>
            </Show>
          </Show>
        </Show>
        <Show when={store.activeTab === "workflows"}>
          <text fg={theme.textMuted}>Coming soon</text>
        </Show>
      </box>

      {/* Keyboard hints at bottom */}
      <box paddingLeft={4} paddingRight={4} flexDirection="row" gap={2} paddingTop={1}>
        <Show when={store.activeTab === "agents" && !store.selectedAgent}>
          <text>
            <span style={{ fg: theme.text }}>Connect</span>{" "}
            <span style={{ fg: theme.textMuted }}>enter</span>
          </text>
          <text>
            <span style={{ fg: theme.text }}>Details</span>{" "}
            <span style={{ fg: theme.textMuted }}>ctrl+l</span>
          </text>
          <text>
            <span style={{ fg: theme.text }}>Refresh</span>{" "}
            <span style={{ fg: theme.textMuted }}>ctrl+r</span>
          </text>
        </Show>
        <Show when={store.activeTab === "agents" && store.selectedAgent}>
          <text>
            <span style={{ fg: theme.text }}>Connect</span>{" "}
            <span style={{ fg: theme.textMuted }}>enter</span>
          </text>
          <text>
            <span style={{ fg: theme.text }}>Back</span>{" "}
            <span style={{ fg: theme.textMuted }}>ctrl+b</span>
          </text>
        </Show>
        <Show when={store.activeTab === "teams" && !store.selectedTeam}>
          <text>
            <span style={{ fg: theme.text }}>Connect</span>{" "}
            <span style={{ fg: theme.textMuted }}>enter</span>
          </text>
          <text>
            <span style={{ fg: theme.text }}>Details</span>{" "}
            <span style={{ fg: theme.textMuted }}>ctrl+l</span>
          </text>
          <text>
            <span style={{ fg: theme.text }}>Refresh</span>{" "}
            <span style={{ fg: theme.textMuted }}>ctrl+r</span>
          </text>
        </Show>
        <Show when={store.activeTab === "teams" && store.selectedTeam}>
          <text>
            <span style={{ fg: theme.text }}>Connect</span>{" "}
            <span style={{ fg: theme.textMuted }}>enter</span>
          </text>
          <text>
            <span style={{ fg: theme.text }}>Back</span>{" "}
            <span style={{ fg: theme.textMuted }}>ctrl+b</span>
          </text>
        </Show>
        <text>
          <span style={{ fg: theme.text }}>Switch section</span>{" "}
          <span style={{ fg: theme.textMuted }}>tab</span>
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

function TeamRow(props: {
  id: string
  team: { id: string; name: string; memberCount: number; isConnected: boolean }
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
      paddingLeft={props.team.isConnected ? 1 : 3}
      paddingRight={3}
      gap={1}
      onMouseOver={props.onHover}
      onMouseUp={props.onSelect}
    >
      <Show when={props.team.isConnected}>
        <text flexShrink={0} fg={props.active ? fg : theme.primary}>
          ●
        </text>
      </Show>
      <text
        flexGrow={1}
        fg={props.active ? fg : props.team.isConnected ? theme.primary : theme.text}
        attributes={props.active ? TextAttributes.BOLD : undefined}
      >
        {props.team.name}
      </text>
      <text fg={props.active ? fg : theme.textMuted}>
        {props.team.memberCount} member{props.team.memberCount !== 1 ? "s" : ""}
      </text>
    </box>
  )
}

function AgentDetail(props: {
  agent: { id: string; name: string }
  onBack: () => void
  onConnect: () => void
}) {
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
    if (evt.ctrl && evt.name === "b") {
      props.onBack()
      evt.preventDefault()
    }
    if (evt.name === "return") {
      props.onConnect()
      evt.preventDefault()
    }
  })

  return (
    <box flexDirection="column" gap={1}>
      {/* Header: Name + Status */}
      <box flexDirection="row" gap={2} alignItems="center">
        <text fg={theme.text} attributes={TextAttributes.BOLD}>
          {model()?.name || props.agent.name}
        </text>
        <text fg={isConnected() ? theme.success : theme.textMuted}>
          {isConnected() ? "● Connected" : "○ Available"}
        </text>
      </box>

      {/* Description */}
      <Show when={metadata()?.description}>
        <text fg={theme.text} wrapMode="word">
          {metadata()!.description}
        </text>
      </Show>

      {/* Configuration section */}
      <box gap={0}>
        <text fg={theme.textMuted} attributes={TextAttributes.BOLD}>
          Configuration
        </text>
        <box paddingLeft={2} paddingTop={0}>
          <Show when={metadata()?.model}>
            <box flexDirection="row">
              <text fg={theme.textMuted}>Model    </text>
              <text fg={theme.text}>
                {metadata()!.model!.model}
              </text>
            </box>
            <box flexDirection="row">
              <text fg={theme.textMuted}>Provider </text>
              <text fg={theme.text}>{metadata()!.model!.provider}</text>
            </box>
          </Show>
          <box flexDirection="row">
            <text fg={theme.textMuted}>Tools    </text>
            <text fg={model()?.capabilities?.toolcall ? theme.success : theme.textMuted}>
              {model()?.capabilities?.toolcall ? "Enabled" : "None"}
            </text>
          </box>
        </box>
      </box>
    </box>
  )
}

function TeamDetail(props: {
  team: { id: string; name: string }
  onBack: () => void
  onConnect: () => void
}) {
  const { theme } = useTheme()
  const sync = useSync()
  const local = useLocal()

  const model = createMemo(() => {
    const provider = sync.data.provider.find((p) => p.id === "agentos")
    return provider?.models[props.team.id]
  })

  const isConnected = createMemo(() => {
    const current = local.model.current()
    return current?.providerID === "agentos" && current?.modelID === props.team.id
  })

  const metadata = createMemo(
    () =>
      model()?.options.teamMetadata as
        | {
            description: string | null
            role: string | null
            model: { name: string; model: string; provider: string } | null
            introduction: string | null
            members: { id?: string | null; name?: string | null }[]
          }
        | undefined,
  )

  useKeyboard((evt) => {
    if (evt.ctrl && evt.name === "b") {
      props.onBack()
      evt.preventDefault()
    }
    if (evt.name === "return") {
      props.onConnect()
      evt.preventDefault()
    }
  })

  return (
    <box flexDirection="column" gap={1}>
      {/* Header: Name + Status */}
      <box flexDirection="row" gap={2} alignItems="center">
        <text fg={theme.text} attributes={TextAttributes.BOLD}>
          {model()?.name || props.team.name}
        </text>
        <text fg={isConnected() ? theme.success : theme.textMuted}>
          {isConnected() ? "● Connected" : "○ Available"}
        </text>
      </box>

      {/* Description */}
      <Show when={metadata()?.description}>
        <text fg={theme.text} wrapMode="word">
          {metadata()!.description}
        </text>
      </Show>

      {/* Members section */}
      <Show when={metadata()?.members?.length}>
        <box gap={0}>
          <text fg={theme.textMuted} attributes={TextAttributes.BOLD}>
            Members
          </text>
          <box paddingLeft={2} paddingTop={0}>
            <For each={metadata()!.members}>
              {(member) => (
                <text fg={theme.text}>
                  {member.name || member.id || "Unknown"}
                </text>
              )}
            </For>
          </box>
        </box>
      </Show>

      {/* Configuration section */}
      <box gap={0}>
        <text fg={theme.textMuted} attributes={TextAttributes.BOLD}>
          Configuration
        </text>
        <box paddingLeft={2} paddingTop={0}>
          <Show when={metadata()?.model}>
            <box flexDirection="row">
              <text fg={theme.textMuted}>Model    </text>
              <text fg={theme.text}>
                {metadata()!.model!.model}
              </text>
            </box>
            <box flexDirection="row">
              <text fg={theme.textMuted}>Provider </text>
              <text fg={theme.text}>{metadata()!.model!.provider}</text>
            </box>
          </Show>
          <Show when={metadata()?.role}>
            <box flexDirection="row">
              <text fg={theme.textMuted}>Role     </text>
              <text fg={theme.text}>{metadata()!.role}</text>
            </box>
          </Show>
        </box>
      </box>
    </box>
  )
}
