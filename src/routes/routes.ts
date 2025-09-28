import { RouteNamesEnum } from 'localConstants';
import { Home, Game } from 'pages';
import { RouteType } from 'types';

interface RouteWithTitleType extends RouteType {
  title: string;
}

export const routes: RouteWithTitleType[] = [
  {
    path: RouteNamesEnum.home,
    title: 'Home',
    component: Home
  },
  {
    path: RouteNamesEnum.game,
    title: 'Game',
    component: Game
  }
];
