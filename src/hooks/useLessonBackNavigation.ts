import { useCallback } from 'react';
import { BackHandler, Platform } from 'react-native';
import { router, useFocusEffect, type Href } from 'expo-router';

const LESSON_LIST_ROUTE = '/' satisfies Href;

export function returnToLessonList(): void {
  router.dismissTo(LESSON_LIST_ROUTE);
}

export function useLessonBackNavigation(): () => void {
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') {
        return undefined;
      }

      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        returnToLessonList();
        return true;
      });

      return () => subscription.remove();
    }, []),
  );

  return returnToLessonList;
}
