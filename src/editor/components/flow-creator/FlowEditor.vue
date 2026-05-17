<template>
  <section class="flow-creator" :class="{ 'flow-creator--desktop': isDesktop, 'flow-creator--settings-open': showSettings }">
    <button class="flow-toggle ui-btn" @click="toggleModal">
      <h3>{{ showModal ? 'Hide Flow Editor' : 'Flow Editor' }}</h3>
    </button>

    <div v-if="showModal" class="flow-sidebar-overlay" @click="toggleModal" />

    <aside
      class="flow-sidebar flow-modal flow-modal--resizable"
      :class="{ 'flow-sidebar--open': showModal }"
    >
      <div class="flow-modal__debug">
        <div class="flow-controls-row flow-controls-row--top">
          <div class="flow-controls-group flow-controls-group--fields">
            <div class="flow-subcategory">
              <button type="button" class="flow-subcategory__header" @click="isTransitionOpen = !isTransitionOpen">
                <span class="flow-subcategory__title">Transition</span>
                <span class="flow-subcategory__chevron" :class="{ 'flow-subcategory__chevron--open': isTransitionOpen }">▸</span>
              </button>
              <div v-show="isTransitionOpen" class="flow-field-pair">
                <div class="flow-field-group flow-field-group--toggle">
                  <span class="flow-field-label">Auto Snap</span>
                  <label class="flow-switch" for="autosnap-enabled-toggle">
                    <input
                      id="autosnap-enabled-toggle"
                      v-model="selectedAutoSnapEnabled"
                      type="checkbox"
                      class="flow-switch__input"
                      role="switch"
                      @change="emitAutoSnapEnabled"
                    />
                    <span class="flow-switch__track" aria-hidden="true" />
                  </label>
                </div>
                <label class="flow-field-group" for="snap-ease-select">
                  <span class="flow-field-label">Snap ease</span>
                  <select id="snap-ease-select" v-model="selectedEase" class="flow-field-select" @change="emitSnapEase">
                    <option v-for="ease in easeOptions" :key="ease" :value="ease">
                      {{ ease }}
                    </option>
                  </select>
                </label>
                <label class="flow-field-group flow-field-group--speed" for="transition-speed-input">
                  <span class="flow-field-label">Speed</span>
                  <input
                    id="transition-speed-input"
                    v-model.number="selectedTransitionSpeed"
                    type="number"
                    class="flow-field-select flow-field-input flow-field-input--speed"
                    :min="MIN_TRANSITION_SPEED"
                    :max="MAX_TRANSITION_SPEED"
                    :step="TRANSITION_SPEED_STEP"
                    @change="emitTransitionSpeed"
                  />
                </label>
              </div>
            </div>

            <div class="flow-subcategory">
              <button type="button" class="flow-subcategory__header" @click="isAutoPlayOpen = !isAutoPlayOpen">
                <span class="flow-subcategory__title">AutoPlay</span>
                <span class="flow-subcategory__chevron" :class="{ 'flow-subcategory__chevron--open': isAutoPlayOpen }">▸</span>
              </button>
              <div v-show="isAutoPlayOpen" class="flow-field-pair">
                <div class="flow-field-group flow-field-group--toggle">
                  <span class="flow-field-label">Enabled</span>
                  <label class="flow-switch" for="autoplay-enabled-toggle">
                    <input
                      id="autoplay-enabled-toggle"
                      v-model="selectedAutoPlayEnabled"
                      type="checkbox"
                      class="flow-switch__input"
                      role="switch"
                      @change="emitAutoPlayEnabled"
                    />
                    <span class="flow-switch__track" aria-hidden="true" />
                  </label>
                </div>
                <label class="flow-field-group flow-field-group--speed" for="autoplay-speed-input">
                  <span class="flow-field-label">Interval (s)</span>
                  <input
                    id="autoplay-speed-input"
                    v-model.number="selectedAutoPlaySpeed"
                    type="number"
                    class="flow-field-select flow-field-input flow-field-input--speed"
                    :min="MIN_AUTOPLAY_SPEED"
                    :max="MAX_AUTOPLAY_SPEED"
                    :step="AUTOPLAY_SPEED_STEP"
                    :disabled="!selectedAutoPlayEnabled"
                    @change="emitAutoPlaySpeed"
                  />
                </label>
              </div>
            </div>

          </div>
        </div>

        <div class="flow-controls-row flow-controls-row--bottom">
          <div class="flow-subcategory">
            <button type="button" class="flow-subcategory__header" @click="isFilesOpen = !isFilesOpen">
              <span class="flow-subcategory__title">Files</span>
              <span class="flow-subcategory__chevron" :class="{ 'flow-subcategory__chevron--open': isFilesOpen }">▸</span>
            </button>
            <div v-show="isFilesOpen" class="flow-field-pair">
              <label class="flow-field-group flow-field-group--data" for="data-file-select">
                <span class="flow-field-label">Data file</span>
                <select
                  id="data-file-select"
                  v-model="selectedDataFile"
                  class="flow-field-select"
                  @change="void importSelectedDataFile()"
                >
                  <option value="">Select story</option>
                  <option v-for="storyId in availableStoryIds" :key="storyId" :value="storyId">
                    {{ storyId }}
                  </option>
                </select>
              </label>
              <div class="flow-controls-group flow-controls-group--actions">
                <button class="ui-btn" @click="exportFlowJson">Export JSON</button>
                <button type="button" class="ui-btn" @click="openJsonFilePicker">Import JSON</button>
              </div>
            </div>
          </div>
        </div>

        <input
          ref="jsonFileInputRef"
          type="file"
          class="flow-file-input"
          accept=".json,application/json"
          @change="onJsonFileChange"
        />
      </div>

      <div ref="canvasRef" class="flow-canvas" :style="canvasStyle">
        <div class="flow-canvas-loop-toggle">
          <span class="flow-canvas-loop-toggle__label">Loop</span>
          <label class="flow-switch" for="loop-enabled-toggle">
            <input
              id="loop-enabled-toggle"
              v-model="selectedLoopEnabled"
              type="checkbox"
              class="flow-switch__input"
              role="switch"
              @change="emitLoopEnabled"
            />
            <span class="flow-switch__track" aria-hidden="true" />
          </label>
        </div>
        <div class="flow-stage" :style="stageStyle">
          <div class="flow-links">
            <div
              v-for="link in flowLinks"
              :key="link.id"
              class="flow-link"
              :style="link.style"
            />
          </div>

          <div
            v-for="node in positionedPanels"
            :key="node.panel.id"
            class="flow-node"
            :data-panel-id="node.panel.id"
            :style="nodeStyle(node.x, node.y)"
            @click="handleNodeClick(node.index)"
          >
            <button
              class="flow-node__delete"
              title="Delete slide"
              @click.stop="deletePanelAt(node.index)"
            >
              &times;
            </button>

            <FlowNodeCard :panel="node.panel" :index="node.index" />

            <button
              v-for="dir in insertableDirections(node.index)"
              :key="`${node.panel.id}-${dir}`"
              class="flow-handle"
              :class="`flow-handle--${dir}`"
              @click.stop="insertAfter(node.index, dir)"
              :title="`Insert ${dir}`"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </aside>

    <SlidePropertiesModal
      :open="showSettings"
      :panel="selectedPanel"
      :side="slideSettingsSide"
      :can-upload-images="props.canUploadImages ?? true"
      :enable-ctas="props.enableCtas ?? true"
      @toggle-side="toggleSlideSettingsSide"
      @close="closeSettings"
      @save="saveSettings"
      @delete="deletePanel"
    />
  </section>
</template>

<script setup lang="ts">
import FlowNodeCard from './FlowNodeCard.vue'
import SlidePropertiesModal from './SlidePropertiesModal.vue'
import { useFlowEditorController } from '../../composables/useFlowEditorController'
import type { FlowEditorEmit, FlowEditorProps } from '../../types/flowEditor'

const props = defineProps<FlowEditorProps>()
const emit = defineEmits<FlowEditorEmit>()

const {
  showModal,
  canvasRef,
  showSettings,
  positionedPanels,
  canvasStyle,
  stageStyle,
  flowLinks,
  selectedPanel,
  nodeStyle,
  closeSettings,
  saveSettings,
  deletePanel,
  deletePanelAt,
  exportFlowJson,
  insertableDirections,
  insertAfter,
  availableStoryIds,
  selectedDataFile,
  selectedAutoSnapEnabled,
  selectedEase,
  selectedTransitionSpeed,
  selectedAutoPlayEnabled,
  selectedAutoPlaySpeed,
  selectedLoopEnabled,
  isDesktop,
  jsonFileInputRef,
  isTransitionOpen,
  isAutoPlayOpen,
  isFilesOpen,
  slideSettingsSide,
  toggleSlideSettingsSide,
  MIN_TRANSITION_SPEED,
  MAX_TRANSITION_SPEED,
  TRANSITION_SPEED_STEP,
  MIN_AUTOPLAY_SPEED,
  MAX_AUTOPLAY_SPEED,
  AUTOPLAY_SPEED_STEP,
  toggleModal,
  emitSnapEase,
  emitAutoSnapEnabled,
  emitTransitionSpeed,
  emitAutoPlayEnabled,
  emitAutoPlaySpeed,
  emitLoopEnabled,
  handleNodeClick,
  importSelectedDataFile,
  onJsonFileChange,
  openJsonFilePicker,
  exposed
} = useFlowEditorController(props, emit)

defineExpose(exposed)

void canvasRef
void jsonFileInputRef
</script>
