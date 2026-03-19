<template>
  <div class="tpm-shell w-full min-h-screen text-slate-900">
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="floating-orb absolute -left-10 top-16 h-40 w-40 rounded-full bg-amber-200/50 blur-3xl"></div>
      <div class="floating-orb-delayed absolute right-0 top-24 h-56 w-56 rounded-full bg-primary-200/50 blur-3xl"></div>
      <div class="floating-orb absolute bottom-10 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-lime-100/70 blur-3xl"></div>
    </div>

    <main class="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-5 px-4 py-4 sm:px-6 lg:px-8">
      <header class="sticky top-0 z-30 -mx-1 px-1 pb-2 pt-1">
        <div class="glass-panel rounded-[1.75rem] border border-white/80 bg-white/80 p-4 shadow-[0_20px_50px_rgba(42,55,51,0.14)]">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex min-w-0 items-center gap-3">
              <NuxtLink
                to="/"
                class="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-primary-200 bg-white text-primary-800 shadow-sm transition hover:-translate-y-0.5 hover:border-primary-300 hover:bg-primary-50"
                aria-label="Back to main site"
              >
                <i class="fas fa-arrow-left text-sm"></i>
              </NuxtLink>

              <div class="min-w-0">
                <p class="text-[11px] font-semibold uppercase tracking-[0.3em] text-primary-700">
                  TPM Bar Tab
                </p>
                <h1 class="headline truncate text-2xl font-semibold leading-tight text-slate-900 sm:text-3xl">
                  Order The Round
                </h1>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <button
                type="button"
                class="rounded-full border border-primary-300 bg-primary-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="!orderedItems.length"
                @click="copyOrder"
              >
                {{ copyButtonLabel }}
              </button>
              <button
                type="button"
                class="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                @click="resetQuantities"
              >
                Reset
              </button>
              <button
                type="button"
                class="rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 transition hover:border-amber-400 hover:bg-amber-100"
                @click="clearSessionItems"
              >
                Clear Extras
              </button>
            </div>
          </div>

          <div class="mt-3 flex flex-wrap items-center gap-2">
            <span class="compact-stat">
              <strong>{{ totalQuantity }}</strong>
              items
            </span>
            <span class="compact-stat">
              <strong>{{ varietyCount }}</strong>
              varieties
            </span>
            <span class="compact-stat">
              <strong>{{ allItems.length }}</strong>
              on menu
            </span>
            <span class="compact-note">
              {{ orderedItems.length ? displaySummary : 'Tap items and the bartender summary builds itself.' }}
            </span>
          </div>
        </div>
      </header>

      <section class="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div class="glass-panel rounded-[2rem] border border-white/70 bg-white/[0.72] p-6 shadow-[0_18px_40px_rgba(42,55,51,0.1)] sm:p-8">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.3em] text-primary-700">Menu Board</p>
              <h2 class="headline mt-2 text-3xl font-semibold text-slate-900">Tap To Build The Round</h2>
              <p class="mt-2 text-sm leading-6 text-slate-600">
                The ordering cards come first now, so the table can start tapping right away.
              </p>
            </div>
            <span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-600">
              {{ allItems.length }} options loaded
            </span>
          </div>

          <div class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <article
              v-for="item in itemsWithCounts"
              :key="item.id"
              class="menu-card rounded-[1.6rem] border p-4 shadow-sm"
              :class="item.quantity ? 'border-primary-300 bg-primary-50/[0.85]' : 'border-white bg-white/90'"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="flex items-center gap-3">
                  <img
                    v-if="item.image"
                    :src="item.image"
                    :alt="item.name"
                    class="h-14 w-14 rounded-2xl border border-white bg-white object-cover shadow-sm"
                  >
                  <div
                    v-else
                    class="flex h-14 w-14 items-center justify-center rounded-2xl border border-white bg-white text-3xl shadow-sm"
                  >
                    {{ item.emoji || '✨' }}
                  </div>

                  <div>
                    <p class="font-semibold text-slate-900">{{ item.name }}</p>
                    <span
                      class="mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
                      :class="item.kind === 'permanent'
                        ? 'border border-primary-200 bg-primary-100 text-primary-800'
                        : 'border border-amber-200 bg-amber-50 text-amber-900'"
                    >
                      {{ item.kind === 'permanent' ? 'Permanent' : 'Session' }}
                    </span>
                  </div>
                </div>

                <button
                  v-if="item.kind === 'session'"
                  type="button"
                  class="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  @click="removeSessionItem(item.id)"
                >
                  Remove
                </button>
              </div>

              <div class="mt-5 flex items-center justify-between gap-4">
                <button
                  type="button"
                  class="counter-button flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                  @click="changeQuantity(item.id, -1)"
                >
                  -
                </button>

                <div class="text-center">
                  <p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Quantity</p>
                  <p class="mt-1 text-3xl font-semibold text-slate-900">{{ item.quantity }}</p>
                </div>

                <button
                  type="button"
                  class="counter-button flex h-11 w-11 items-center justify-center rounded-2xl border border-primary-300 bg-primary-700 text-lg font-semibold text-white shadow-sm transition hover:border-primary-500 hover:bg-primary-600"
                  @click="changeQuantity(item.id, 1)"
                >
                  +
                </button>
              </div>

              <div v-if="item.quantity > 0 || item.note" class="mt-4">
                <label class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Comment
                </label>
                <input
                  :value="item.note"
                  type="text"
                  placeholder="If unavailable, get IPA"
                  class="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-200"
                  @input="setItemNote(item.id, $event.target.value)"
                >
              </div>
            </article>

            <article class="menu-card rounded-[1.6rem] border border-dashed border-primary-300 bg-white/80 p-4 shadow-sm">
              <div class="flex items-center gap-3">
                <div class="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary-200 bg-primary-50 text-3xl shadow-sm">
                  +
                </div>
                <div>
                  <p class="font-semibold text-slate-900">Custom Item</p>
                  <p class="mt-1 text-sm leading-5 text-slate-600">
                    Add a one-off extra without leaving the menu.
                  </p>
                </div>
              </div>

              <form class="mt-5 space-y-3" @submit.prevent="addSessionItem">
                <div>
                  <label class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500" for="custom-item-name">
                    Name
                  </label>
                  <input
                    id="custom-item-name"
                    v-model.trim="newItemName"
                    type="text"
                    placeholder="Espresso martini"
                    class="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-200"
                  >
                </div>

                <div class="flex items-end gap-3">
                  <div class="min-w-[96px] flex-1">
                    <label class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500" for="custom-item-quantity">
                      Quantity
                    </label>
                    <input
                      id="custom-item-quantity"
                      v-model.number="newItemQuantity"
                      type="number"
                      min="1"
                      step="1"
                      class="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-200"
                    >
                  </div>

                  <button
                    type="submit"
                    class="inline-flex h-[46px] items-center justify-center rounded-2xl bg-amber-400 px-4 py-3 text-sm font-semibold text-amber-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-amber-300"
                  >
                    Add
                  </button>
                </div>
              </form>
            </article>
          </div>
        </div>

        <aside>
          <section class="glass-panel rounded-[2rem] border border-primary-100/80 bg-primary-950/[0.9] p-6 text-white shadow-[0_18px_40px_rgba(20,28,26,0.24)] sm:p-8">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.3em] text-primary-200">Bartender Summary</p>
                <h2 class="headline mt-2 text-3xl font-semibold">Order Slip</h2>
              </div>
              <span class="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm font-semibold text-white">
                {{ totalQuantity }}x total
              </span>
            </div>

            <div class="mt-5 rounded-3xl border border-white/10 bg-white/5 p-4">
              <p v-if="!orderedItems.length" class="text-sm leading-6 text-primary-100/90">
                Nothing on the tab yet. Add items from the menu and this slip stays ready for the bartender.
              </p>

              <ul v-else class="space-y-3">
                <li
                  v-for="item in orderedItems"
                  :key="item.id"
                  class="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div class="flex items-start gap-3">
                    <span class="text-2xl">{{ item.emoji || '✨' }}</span>
                    <div>
                      <span class="font-medium text-white">{{ item.name }}</span>
                      <p v-if="item.note" class="mt-1 text-xs leading-5 text-primary-100/70">
                        {{ item.note }}
                      </p>
                    </div>
                  </div>
                  <span class="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-primary-50">
                    {{ item.quantity }}x
                  </span>
                </li>
              </ul>
            </div>

            <div class="mt-4 rounded-3xl border border-amber-200/20 bg-amber-50/10 p-4">
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-amber-100/80">Read This Out</p>
              <p class="mt-3 text-base leading-7 text-amber-50">
                {{ displaySummary }}
              </p>
            </div>

            <p class="mt-4 text-sm leading-6 text-primary-100/80">
              Permanent items still live in
              <code class="rounded bg-white/10 px-2 py-1 text-primary-50">data/tpm-bar-items.ts</code>.
            </p>
          </section>
        </aside>
      </section>
    </main>
  </div>
</template>

<script setup>
import { permanentBarItems } from '~/data/tpm-bar-items'

const STORAGE_KEY = 'tpm-bar-session-v1'

const newItemName = ref('')
const newItemQuantity = ref(1)
const copyButtonLabel = ref('Copy Order')
const sessionItems = ref([])
const quantities = ref({})
const notes = ref({})

let copyResetTimer

useSeoMeta({
  title: 'TPM Bar Tab',
  description: 'A small, table-side drink order tracker for TPM bar rounds.',
})

const permanentItems = computed(() => permanentBarItems.map(item => ({
  ...item,
  kind: 'permanent',
})))

const allItems = computed(() => [
  ...permanentItems.value,
  ...sessionItems.value.map(item => ({
    ...item,
    kind: 'session',
  })),
])

const itemsWithCounts = computed(() => allItems.value.map(item => ({
  ...item,
  quantity: quantities.value[item.id] ?? 0,
  note: notes.value[item.id] ?? '',
})))

const orderedItems = computed(() => itemsWithCounts.value.filter(item => item.quantity > 0))

const totalQuantity = computed(() => orderedItems.value.reduce((sum, item) => sum + item.quantity, 0))

const varietyCount = computed(() => orderedItems.value.length)

const displaySummary = computed(() => {
  if (!orderedItems.value.length) {
    return 'Nothing ordered yet.'
  }

  return orderedItems.value
    .map((item) => {
      const cleanedNote = item.note.trim()
      return cleanedNote
        ? `${item.quantity} x ${item.name} (${cleanedNote})`
        : `${item.quantity} x ${item.name}`
    })
    .join(', ')
})

const copySummary = computed(() => {
  if (!orderedItems.value.length) {
    return ''
  }

  return [
    'TPM bar order',
    ...orderedItems.value.map((item) => {
      const cleanedNote = item.note.trim()
      return cleanedNote
        ? `${item.quantity} x ${item.name} - ${cleanedNote}`
        : `${item.quantity} x ${item.name}`
    }),
  ].join('\n')
})

const normalizeLabel = value => value.toLowerCase().trim().replace(/\s+/g, ' ')

const slugify = value => value
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')

const persistState = () => {
  if (!process.client) {
    return
  }

  const cleanQuantities = Object.fromEntries(
    Object.entries(quantities.value).filter(([, quantity]) => Number(quantity) > 0)
  )
  const cleanNotes = Object.fromEntries(
    Object.entries(notes.value)
      .map(([itemId, note]) => [itemId, typeof note === 'string' ? note.trim() : ''])
      .filter(([, note]) => note)
  )

  if (!sessionItems.value.length && !Object.keys(cleanQuantities).length && !Object.keys(cleanNotes).length) {
    localStorage.removeItem(STORAGE_KEY)
    return
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      sessionItems: sessionItems.value,
      quantities: cleanQuantities,
      notes: cleanNotes,
    })
  )
}

const changeQuantity = (itemId, delta) => {
  const currentQuantity = quantities.value[itemId] ?? 0
  const nextQuantity = Math.max(0, currentQuantity + delta)

  if (nextQuantity === 0) {
    delete quantities.value[itemId]
    delete notes.value[itemId]
    return
  }

  quantities.value[itemId] = nextQuantity
}

const addSessionItem = () => {
  const trimmedName = newItemName.value.trim()
  const quantityToAdd = Math.max(1, Number(newItemQuantity.value) || 1)

  if (!trimmedName) {
    return
  }

  const existingItem = allItems.value.find(item => normalizeLabel(item.name) === normalizeLabel(trimmedName))

  if (existingItem) {
    changeQuantity(existingItem.id, quantityToAdd)
  } else {
    const itemId = `session-${slugify(trimmedName) || 'custom'}-${Date.now().toString(36)}`

    sessionItems.value = [
      ...sessionItems.value,
      {
        id: itemId,
        name: trimmedName,
        emoji: '✨',
      },
    ]

    quantities.value[itemId] = quantityToAdd
  }

  newItemName.value = ''
  newItemQuantity.value = 1
}

const setItemNote = (itemId, noteValue) => {
  const nextNote = noteValue ?? ''

  if (!nextNote.trim()) {
    delete notes.value[itemId]
    return
  }

  notes.value[itemId] = nextNote
}

const removeSessionItem = itemId => {
  sessionItems.value = sessionItems.value.filter(item => item.id !== itemId)
  delete quantities.value[itemId]
  delete notes.value[itemId]
}

const clearSessionItems = () => {
  const permanentIds = new Set(permanentBarItems.map(item => item.id))

  sessionItems.value = []
  quantities.value = Object.fromEntries(
    Object.entries(quantities.value).filter(([itemId]) => permanentIds.has(itemId))
  )
  notes.value = Object.fromEntries(
    Object.entries(notes.value).filter(([itemId]) => permanentIds.has(itemId))
  )
}

const resetQuantities = () => {
  quantities.value = {}
  notes.value = {}
}

const copyOrder = async () => {
  if (!copySummary.value || !process.client) {
    return
  }

  try {
    await navigator.clipboard.writeText(copySummary.value)
    copyButtonLabel.value = 'Copied'
  } catch {
    copyButtonLabel.value = 'Copy Failed'
  }

  clearTimeout(copyResetTimer)
  copyResetTimer = window.setTimeout(() => {
    copyButtonLabel.value = 'Copy Order'
  }, 1800)
}

watch(sessionItems, persistState, { deep: true })
watch(quantities, persistState, { deep: true })
watch(notes, persistState, { deep: true })

onMounted(() => {
  if (!process.client) {
    return
  }

  try {
    const rawState = localStorage.getItem(STORAGE_KEY)

    if (!rawState) {
      return
    }

    const parsedState = JSON.parse(rawState)

    if (Array.isArray(parsedState?.sessionItems)) {
      sessionItems.value = parsedState.sessionItems
        .filter(item => typeof item?.id === 'string' && typeof item?.name === 'string')
        .map(item => ({
          id: item.id,
          name: item.name,
          emoji: typeof item.emoji === 'string' && item.emoji.trim() ? item.emoji : '✨',
        }))
    }

    if (parsedState?.quantities && typeof parsedState.quantities === 'object') {
      quantities.value = Object.fromEntries(
        Object.entries(parsedState.quantities)
          .map(([itemId, quantity]) => [itemId, Math.max(0, Number(quantity) || 0)])
          .filter(([, quantity]) => quantity > 0)
      )
    }

    if (parsedState?.notes && typeof parsedState.notes === 'object') {
      notes.value = Object.fromEntries(
        Object.entries(parsedState.notes)
          .map(([itemId, note]) => [itemId, typeof note === 'string' ? note.trim() : ''])
          .filter(([, note]) => note)
      )
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY)
  }
})

onUnmounted(() => {
  clearTimeout(copyResetTimer)
})
</script>

<style scoped>
.tpm-shell {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 12% 12%, rgba(255, 218, 123, 0.35), transparent 22%),
    radial-gradient(circle at 88% 18%, rgba(88, 125, 113, 0.28), transparent 26%),
    linear-gradient(180deg, #faf3e3 0%, #eef5f0 52%, #f8fbf8 100%);
}

.headline {
  font-family: Georgia, "Times New Roman", serif;
}

.glass-panel {
  backdrop-filter: blur(16px);
}

.compact-stat {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border-radius: 9999px;
  border: 1px solid rgba(189, 210, 202, 0.9);
  background: rgba(245, 248, 246, 0.92);
  padding: 0.55rem 0.9rem;
  font-size: 0.9rem;
  color: #374151;
}

.compact-stat strong {
  color: #1f2937;
  font-size: 1rem;
}

.compact-note {
  display: inline-flex;
  align-items: center;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.82);
  padding: 0.55rem 0.9rem;
  font-size: 0.9rem;
  color: #475569;
  max-width: 100%;
}

.menu-card {
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.menu-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 18px 34px rgba(42, 55, 51, 0.1);
}

.counter-button {
  transition: transform 0.12s ease, background-color 0.12s ease, border-color 0.12s ease;
}

.counter-button:active {
  transform: scale(0.96);
}

.floating-orb {
  animation: bob 8s ease-in-out infinite;
}

.floating-orb-delayed {
  animation: bob 10s ease-in-out -2.5s infinite;
}

@keyframes bob {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-12px);
  }
}
</style>
