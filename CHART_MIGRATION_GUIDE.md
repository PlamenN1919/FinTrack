# Миграция от react-native-chart-kit към Victory Native

## Защо да мигрираме?

`react-native-chart-kit` има проблеми със съвместимостта с новите версии на React Native и react-native-svg. **Victory Native** е по-модерна, по-добре поддържана алтернатива.

## Стъпка 1: Инсталиране на Victory Native

```bash
npm install victory-native
```

## Стъпка 2: Примери за миграция

### ПРЕДИ (react-native-chart-kit):

```typescript
import { LineChart } from 'react-native-chart-kit';

<LineChart
  data={{
    labels: ["Jan", "Feb", "Mar"],
    datasets: [{ data: [20, 45, 28] }]
  }}
  width={screenWidth}
  height={220}
  chartConfig={{
    backgroundColor: "#e26a00",
    backgroundGradientFrom: "#fb8c00",
    backgroundGradientTo: "#ffa726",
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  }}
/>
```

### СЛЕД (Victory Native):

```typescript
import { VictoryLine, VictoryChart, VictoryTheme } from 'victory-native';

<VictoryChart theme={VictoryTheme.material}>
  <VictoryLine
    data={[
      { x: "Jan", y: 20 },
      { x: "Feb", y: 45 },
      { x: "Mar", y: 28 }
    ]}
    style={{
      data: { stroke: "#fb8c00" }
    }}
  />
</VictoryChart>
```

## Стъпка 3: Файлове за промяна

### 1. HomeScreen.tsx
- Замени `LineChart` от react-native-chart-kit
- Използвай `VictoryLine` от victory-native

### 2. ReportsScreen.tsx
- Замени `LineChart`, `BarChart`, `PieChart`
- Използвай `VictoryLine`, `VictoryBar`, `VictoryPie`

### 3. FinancialHealthScreen.tsx (ако има графики)
- Замени съответните компоненти

## Стъпка 4: Премахване на стария пакет

```bash
npm uninstall react-native-chart-kit
```

## Стъпка 5: Премахване на workaround

В `App.tsx` премахни:

```typescript
LogBox.ignoreLogs([
  'Unsupported top level event type',
  'topSvgLayout',
]);
```

## Алтернатива: React Native Gifted Charts

Ако предпочитате по-проста библиотека:

```bash
npm install react-native-gifted-charts
```

### Пример:

```typescript
import { LineChart } from 'react-native-gifted-charts';

<LineChart
  data={[
    { value: 20, label: 'Jan' },
    { value: 45, label: 'Feb' },
    { value: 28, label: 'Mar' }
  ]}
  color="#fb8c00"
  thickness={2}
/>
```

## Предимства на Victory Native

✅ Отлична поддръжка и документация
✅ Съвместимост с React Native 0.80+
✅ Много повече опции за персонализация
✅ По-добра производителност
✅ TypeScript поддръжка

## Предимства на Gifted Charts

✅ По-лесна за използване
✅ По-малко код за основни графики
✅ Добра документация
✅ Модерен дизайн

## Препоръка

За **FinTrack** препоръчвам **Victory Native**, защото:
- Имате сложни графики в ReportsScreen
- Нужна е по-голяма гъвкавост
- По-добра интеграция с TypeScript

