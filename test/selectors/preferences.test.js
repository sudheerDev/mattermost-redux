// Copyright (c) 2017 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import assert from 'assert';

import {General, Preferences} from 'constants';

import * as Selectors from 'selectors/entities/preferences';

import deepFreezeAndThrowOnMutation from 'utils/deep_freeze';
import {getPreferenceKey} from 'utils/preference_utils';

describe('Selectors.Preferences', () => {
    const category1 = 'testcategory1';
    const directCategory = Preferences.CATEGORY_DIRECT_CHANNEL_SHOW;
    const groupCategory = Preferences.CATEGORY_GROUP_CHANNEL_SHOW;
    const favCategory = Preferences.CATEGORY_FAVORITE_CHANNEL;

    const name1 = 'testname1';
    const value1 = 'true';
    const pref1 = {category: category1, name: name1, value: value1};

    const dm1 = 'teammate1';
    const dmPref1 = {category: directCategory, name: dm1, value: 'true'};
    const dm2 = 'teammate2';
    const dmPref2 = {category: directCategory, name: dm2, value: 'false'};

    const gp1 = 'group1';
    const prefGp1 = {category: groupCategory, name: gp1, value: 'true'};
    const gp2 = 'group2';
    const prefGp2 = {category: groupCategory, name: gp2, value: 'false'};

    const fav1 = 'favorite1';
    const favPref1 = {category1: favCategory, name: fav1, value: 'true'};
    const fav2 = 'favorite2';
    const favPref2 = {category1: favCategory, name: fav2, value: 'false'};

    const currentUserId = 'currentuserid';

    const myPreferences = {};
    myPreferences[`${category1}--${name1}`] = pref1;
    myPreferences[`${directCategory}--${dm1}`] = dmPref1;
    myPreferences[`${directCategory}--${dm2}`] = dmPref2;
    myPreferences[`${groupCategory}--${gp1}`] = prefGp1;
    myPreferences[`${groupCategory}--${gp2}`] = prefGp2;
    myPreferences[`${favCategory}--${fav1}`] = favPref1;
    myPreferences[`${favCategory}--${fav2}`] = favPref2;

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            users: {
                currentUserId
            },
            preferences: {
                myPreferences
            }
        }
    });

    it('get preference', () => {
        assert.deepEqual(Selectors.get(testState, category1, name1), value1);
    });

    it('get bool preference', () => {
        assert.deepEqual(Selectors.getBool(testState, category1, name1), value1 === 'true');
    });

    it('get preferences by category', () => {
        const getCategory = Selectors.makeGetCategory();
        assert.deepEqual(getCategory(testState, category1), [pref1]);
    });

    it('get direct channel show preferences', () => {
        assert.deepEqual(Selectors.getDirectShowPreferences(testState), [dmPref1, dmPref2]);
    });

    it('get group channel show preferences', () => {
        assert.deepEqual(Selectors.getGroupShowPreferences(testState), [prefGp1, prefGp2]);
    });

    it('getTeammateNameDisplaySetting', () => {
        it('only preference set (3.10 and lower)', () => {
            assert.equal(
                Selectors.getTeammateNameDisplaySetting({
                    entities: {
                        general: {
                            config: {}
                        },
                        preferences: {
                            myPreferences: {
                                [`${Preferences.CATEGORY_DISPLAY_SETTINGS}--${Preferences.NAME_NAME_FORMAT}`]: General.TEAMMATE_NAME_DISPLAY.SHOW_FULLNAME
                            }
                        }
                    }
                }),
                General.TEAMMATE_NAME_DISPLAY.SHOW_NICKNAME_FULLNAME
            );
        });

        it('both preference and config set (server created before 4.0)', () => {
            assert.equal(
                Selectors.getTeammateNameDisplaySetting({
                    entities: {
                        general: {
                            config: {
                                TeammateNameDisplay: General.TEAMMATE_NAME_DISPLAY.SHOW_NICKNAME_FULLNAME
                            }
                        },
                        preferences: {
                            myPreferences: {
                                [`${Preferences.CATEGORY_DISPLAY_SETTINGS}--${Preferences.NAME_NAME_FORMAT}`]: General.TEAMMATE_NAME_DISPLAY.SHOW_FULLNAME
                            }
                        }
                    }
                }),
                General.TEAMMATE_NAME_DISPLAY.SHOW_NICKNAME_FULLNAME
            );
        });

        it('only config set (server created after or at 4.0)', () => {
            assert.equal(
                Selectors.getTeammateNameDisplaySetting({
                    entities: {
                        general: {
                            config: {
                                TeammateNameDisplay: General.TEAMMATE_NAME_DISPLAY.SHOW_NICKNAME_FULLNAME
                            }
                        },
                        preferences: {
                            myPreferences: {}
                        }
                    }
                }),
                General.TEAMMATE_NAME_DISPLAY.SHOW_NICKNAME_FULLNAME
            );
        });
    });

    describe('get theme', () => {
        it('default theme', () => {
            const currentTeamId = '1234';

            assert.equal(Selectors.getTheme({
                entities: {
                    teams: {
                        currentTeamId
                    },
                    preferences: {
                        myPreferences: {
                        }
                    }
                }
            }), Preferences.THEMES.default);
        });

        it('custom theme', () => {
            const currentTeamId = '1234';
            const theme = {sidebarBg: '#ff0000'};

            assert.deepEqual(Selectors.getTheme({
                entities: {
                    teams: {
                        currentTeamId
                    },
                    preferences: {
                        myPreferences: {
                            [getPreferenceKey(Preferences.CATEGORY_THEME, '')]: {
                                category: Preferences.CATEGORY_THEME, name: '', value: JSON.stringify(theme)
                            }
                        }
                    }
                }
            }), theme);
        });

        it('team-specific theme', () => {
            const currentTeamId = '1234';
            const otherTeamId = 'abcd';
            const theme = {sidebarBg: '#ff0000'};

            assert.deepEqual(Selectors.getTheme({
                entities: {
                    teams: {
                        currentTeamId
                    },
                    preferences: {
                        myPreferences: {
                            [getPreferenceKey(Preferences.CATEGORY_THEME, '')]: {
                                category: Preferences.CATEGORY_THEME, name: '', value: JSON.stringify({})
                            },
                            [getPreferenceKey(Preferences.CATEGORY_THEME, currentTeamId)]: {
                                category: Preferences.CATEGORY_THEME, name: currentTeamId, value: JSON.stringify(theme)
                            },
                            [getPreferenceKey(Preferences.CATEGORY_THEME, otherTeamId)]: {
                                category: Preferences.CATEGORY_THEME, name: otherTeamId, value: JSON.stringify({})
                            }
                        }
                    }
                }
            }), theme);
        });

        it('memoization', () => {
            const currentTeamId = '1234';
            const otherTeamId = 'abcd';

            let state = {
                entities: {
                    teams: {
                        currentTeamId
                    },
                    preferences: {
                        myPreferences: {
                            [getPreferenceKey(Preferences.CATEGORY_THEME, '')]: {
                                category: Preferences.CATEGORY_THEME, name: '', value: JSON.stringify({})
                            },
                            [getPreferenceKey(Preferences.CATEGORY_THEME, currentTeamId)]: {
                                category: Preferences.CATEGORY_THEME, name: currentTeamId, value: JSON.stringify({sidebarBg: '#ff0000'})
                            },
                            [getPreferenceKey(Preferences.CATEGORY_THEME, otherTeamId)]: {
                                category: Preferences.CATEGORY_THEME, name: otherTeamId, value: JSON.stringify({})
                            }
                        }
                    }
                }
            };

            const before = Selectors.getTheme(state);

            assert.equal(before, Selectors.getTheme(state));

            state = {
                ...state,
                entities: {
                    ...state.entities,
                    preferences: {
                        ...state.entities.preferences,
                        myPreferences: {
                            ...state.entities.preferences.myPreferences,
                            somethingUnrelated: {
                                category: 'somethingUnrelated', name: '', value: JSON.stringify({})
                            }
                        }
                    }
                }
            };

            assert.equal(before, Selectors.getTheme(state));

            state = {
                ...state,
                entities: {
                    ...state.entities,
                    preferences: {
                        ...state.entities.preferences,
                        myPreferences: {
                            ...state.entities.preferences.myPreferences,
                            [getPreferenceKey(Preferences.CATEGORY_THEME, currentTeamId)]: {
                                category: Preferences.CATEGORY_THEME, name: currentTeamId, value: JSON.stringify({sidebarBg: '#0000ff'})
                            }
                        }
                    }
                }
            };

            assert.notEqual(before, Selectors.getTheme(state));
            assert.notDeepEqual(before, Selectors.getTheme(state));
        });
    });

    it('get theme from style', () => {
        const theme = {themeColor: '#ffffff'};
        const currentTeamId = '1234';

        const state = {
            entities: {
                teams: {
                    currentTeamId
                },
                preferences: {
                    myPreferences: {
                        [getPreferenceKey(Preferences.CATEGORY_THEME, '')]: {
                            category: Preferences.CATEGORY_THEME, name: '', value: JSON.stringify(theme)
                        }
                    }
                }
            }
        };

        function testStyleFunction(myTheme) {
            return {
                container: {
                    backgroundColor: myTheme.themeColor,
                    height: 100
                }
            };
        }

        const expected = {
            container: {
                backgroundColor: theme.themeColor,
                height: 100
            }
        };

        const getStyleFromTheme = Selectors.makeGetStyleFromTheme();

        assert.deepEqual(getStyleFromTheme(state, testStyleFunction), expected);
    });

    it('get favorites names', () => {
        assert.deepEqual(Selectors.getFavoritesPreferences(testState), [fav1]);
    });

    it('get visible teammates', () => {
        assert.deepEqual(Selectors.getVisibleTeammate(testState), [dm1]);
    });

    it('get visible groups', () => {
        assert.deepEqual(Selectors.getVisibleGroupIds(testState), [gp1]);
    });
});

