<script>
import { ref, reactive, onMounted, computed } from 'vue';

export default {
  setup() {
    const factions = ref({});
    const selectedFactionName = ref(null);
    const selectedFaction = ref(null);
    const isLoading = ref(true);
    const defaultAmount = ref(1); // Default amount
    const amount = ref(defaultAmount.value);
    const maxAmount = 10000;

    // Store unit amounts by faction
    const factionUnitAmounts = reactive({});

    const toggleFaction = (factionName) => {
      if (selectedFactionName.value === factionName) {
        selectedFactionName.value = null;
        selectedFaction.value = null;
      } else {
        selectedFactionName.value = factionName;
        selectedFaction.value = factions.value[factionName];
      }
    };

    // Add or subtract units based on the given amount
    const addUnit = (unit, change) => {
      // Ensure the amount is positive
      const newAmount = Math.max(0, (factionUnitAmounts[selectedFactionName.value] && factionUnitAmounts[selectedFactionName.value][unit.name] || 0) + change);
      if (newAmount === 0) {
        // Remove the unit from storage if its amount becomes 0
        if (factionUnitAmounts[selectedFactionName.value]) {
          delete factionUnitAmounts[selectedFactionName.value][unit.name];
        }
      } else {
        if (!factionUnitAmounts[selectedFactionName.value]) {
          factionUnitAmounts[selectedFactionName.value] = {};
        }
        factionUnitAmounts[selectedFactionName.value][unit.name] = newAmount;
      }
    };

    const removeUnit = (factionName, unitName) => {
      if (factionUnitAmounts[factionName]) {
        delete factionUnitAmounts[factionName][unitName];
      }
    };

    // Use the onMounted hook to fetch data when the component is mounted
    onMounted(async () => {
      try {
        const response = await fetch('rawunits.json');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        factions.value = data;
        isLoading.value = false;
      } catch (error) {
        console.error('Error loading JSON data:', error);
      }
    });

    // Computed property to calculate the total cost based on unitAmounts
    const totalCost = computed(() => {
      let cost = 0;
      for (const factionName in factionUnitAmounts) {
        for (const unitName in factionUnitAmounts[factionName]) {
          const unit = factions.value[factionName].units[unitName];
          const amount = factionUnitAmounts[factionName][unitName];
          cost += unit.cost * amount;
        }
      }
      return cost;
    });

    // Computed property to handle v-model
    const unitAmountVModel = computed({
      get: () => factionUnitAmounts[selectedFactionName.value] && factionUnitAmounts[selectedFactionName.value] || {},
      set: (newValue) => {
        if (!factionUnitAmounts[selectedFactionName.value]) {
          factionUnitAmounts[selectedFactionName.value] = {};
        }
        factionUnitAmounts[selectedFactionName.value] = newValue;
      },
    });

    const exportArmy = () => {
      const armyConfig = {
        factionUnitAmounts: factionUnitAmounts || null
      };
      const json = JSON.stringify(armyConfig);

      // Create a data URI and trigger a download
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'army-config.json';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    };

    return {
      factions,
      selectedFactionName,
      selectedFaction,
      isLoading,
      defaultAmount,
      amount,
      factionUnitAmounts,
      totalCost,
      unitAmountVModel,
      maxAmount,
      toggleFaction,
      exportArmy,
      addUnit,
      removeUnit
    };
  },
};
</script>

<template>
  <div>
    <h1><div id="face">
	<div class="left eye">
		<div class="pupil"></div>
	</div>
	<div class="right eye">
		<div class="pupil"></div>
	</div>
</div><br />
      LOAG <br />TABS Army calculator
    </h1>
    <p class="howto">Use the buttons below to create an army with a maximum total cost of {{ maxAmount }}.
      <br />Click the <button class="mini" :disabled="totalCost > maxAmount" @click="exportArmy">Export Army</button> button, download the file, send it to Chris.eu
    <br/>
  If you have any specific requests for the army layout, let Chris know.</p>

    <section class="factions-container">
      <button v-for="(faction, factionName) in factions" :key="factionName" @click="toggleFaction(factionName)"
        :class="[{ active: selectedFactionName === factionName }, { disabled: isLoading }]">
        {{ factionName }}
      </button>
    </section>

    <div class="units-container loader" v-if="isLoading">
      <div class="hourglass"></div>
    </div>

    <div class="info-summary" v-if="factions && selectedFactionName && factions[selectedFactionName]">
      <div class="units-container buttons-container">
        <div v-for="(unit, unitName) in factions[selectedFactionName].units" :key="unitName" class="unit">
          <div class="text-info">{{ unit.name }} ({{ unit.cost }})</div>
          <div class="change-amount">
            <button class="mini" @click="addUnit(unit, -1)">-</button>
            <input type="text" name="amount" :value="unitAmountVModel[unit.name]"
              @input="unitAmountVModel[unit.name] = $event.target.value" min="1" />
            <button class="mini" @click="addUnit(unit, 1)" :disabled="totalCost >= maxAmount || totalCost + unit.cost > maxAmount">+</button>
          </div>
        </div>
      </div>
      <div class="units-summary">
        <div class="summary">
          <dl class="text" v-for="(factionAmounts, factionName) in factionUnitAmounts" :key="factionName">
            <dt>{{ factionName }}</dt>
            <dd v-for="(amount, unitName) in factionAmounts" :key="unitName" class="summary-line">
              {{ unitName }}: {{ amount }}
              <span v-if="factions[factionName] && factions[factionName].units[unitName]">
                (<span class="total-cost">{{ amount * factions[factionName].units[unitName].cost }}</span>)
              </span>
              <button class="mini remove-button" @click="removeUnit(factionName, unitName)"
                title="Remove unit(s)">X</button>
            </dd>
          </dl>
        </div>
        <div class="total">
          <dl>
            <dt>Total Cost</dt>
            <dd class="total-cost"><span :class="[{'warning': totalCost > maxAmount}]">{{ totalCost }}</span>/{{ maxAmount }}</dd>
          </dl>
        </div>
      </div>
    </div>
  </div>
  <div class="export-container">
    <button :disabled="totalCost > maxAmount" @click="exportArmy">Export Army</button>
  </div>
</template>