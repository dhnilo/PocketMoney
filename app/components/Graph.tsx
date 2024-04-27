import Colors from '../constants/Colors';
import { View, Text } from 'react-native';
import { LineGraph, GraphPoint } from 'react-native-graph';
import timeseries from '@/assets/data/timeseries.json';
import { MonoText } from './StyledText';
import { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import { ActivityIndicator } from 'react-native';

const query = gql`
  query MyQuery($symbol: String!, $interval: String!) {
    time_series(interval: $interval, symbol: $symbol) {
      values {
        datetime
        close
      }
    }
  }
`;

const Graph = ({ symbol }: { symbol: string }) => {
  const [selectedPoint, setSelectedPoint] = useState<GraphPoint>();

  const { data, loading, error } = useQuery(query, {
    variables: {
      symbol,
      interval: '1day',
    },
  });

  if (loading) {
    return <ActivityIndicator />;
  }
  if (error) {
    return <Text>Error</Text>;
  }

  const points: GraphPoint[] = data.time_series.values.map((value: any) => ({
    date: new Date(value.datetime),
    value: Number.parseFloat(value.close),
  })).reverse();

  const onPointSelected = (point: GraphPoint) => {
    setSelectedPoint(point);
  };

  return (
    <View>
      <MonoText style={{ fontSize: 20, fontWeight: 'bold', color: Colors.dark}}>
        ${selectedPoint?.value.toFixed(2)}
      </MonoText>
      <Text style={{ color: 'gray' }}>
        {selectedPoint?.date.toDateString()}
      </Text>

      <LineGraph
        style={{ width: '100%', height: 300 }}
        points={points}
        animated={true}
        color={selectedPoint?.value && selectedPoint.value < 0 ? '#52ab59' : '#fc032c'}
        gradientFillColors={['#0175605D', '#7476df00']}
        enablePanGesture
        onPointSelected={onPointSelected}
        enableIndicator
        indicatorPulsating
        enableFadeInMask
      />
    </View>
  );
};

export default Graph;