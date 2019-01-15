// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import {PostTypes, ChannelTypes} from 'action_types';
import postsReducer, {
    openGraph as openGraphReducer,
    reactions as reactionsReducer,
    removeUnneededMetadata,
} from 'reducers/entities/posts';
import deepFreeze from 'utils/deep_freeze';

describe('Reducers.posts', () => {
    describe('RECEIVED_POST', () => {
        it('should remove unneeded metadata', () => {
            const state = deepFreeze({
                posts: {},
                postsInChannel: {},
            });
            const post = {
                id: 'post',
                metadata: {
                    emojis: [{name: 'emoji'}],
                    files: [{id: 'file', post_id: 'post'}],
                },
            };
            const action = {
                type: PostTypes.RECEIVED_POST,
                data: post,
            };

            const nextState = postsReducer(state, action);

            assert.deepEqual(nextState.posts, {
                post: {
                    id: 'post',
                    metadata: {},
                },
            });
        });
    });

    describe('RECEIVED_NEW_POST', () => {
        it('should remove unneeded metadata', () => {
            const state = deepFreeze({
                posts: {},
                postsInChannel: {},
            });
            const action = {
                type: PostTypes.RECEIVED_NEW_POST,
                data: {
                    id: 'post',
                    metadata: {
                        emojis: [{name: 'emoji'}],
                        files: [{id: 'file', post_id: 'post'}],
                    },
                },
            };

            const nextState = postsReducer(state, action);

            assert.deepEqual(nextState.posts, {
                post: {
                    id: 'post',
                    metadata: {},
                },
            });
        });
    });

    describe('RECEIVED_POSTS', () => {
        it('should remove unneeded metadata', () => {
            const state = deepFreeze({
                posts: {},
                postsInChannel: {},
            });
            const action = {
                type: PostTypes.RECEIVED_POSTS,
                data: {
                    order: ['post1'],
                    posts: {
                        post1: {
                            id: 'post1',
                            metadata: {
                                emojis: [{name: 'emoji'}],
                                files: [{id: 'file1', post_id: 'post1'}],
                            },
                        },
                        post2: {
                            id: 'post2',
                            root_id: 'post1',
                            metadata: {
                                emojis: [{name: 'emoji'}],
                                files: [{id: 'file2', post_id: 'post2'}],
                            },
                        },
                    },
                },
            };

            const nextState = postsReducer(state, action);

            assert.deepEqual(nextState.posts, {
                post1: {
                    id: 'post1',
                    metadata: {},
                },
                post2: {
                    id: 'post2',
                    root_id: 'post1',
                    metadata: {},
                },
            });
        });
    });

    it('REMOVE_PENDING_POST on posts', () => {
        const posts = {
            post_id: {},
            other_post_id: {},
        };
        const postsInChannel = {
            channel_id: ['post_id', 'other_post_id'],
            other_channel_id: ['post_id', 'other_post_id'],
        };
        const pendingPostIds = ['post_id', 'other_post_id'];

        let state = {posts, postsInChannel, pendingPostIds};
        const testAction = {
            type: PostTypes.REMOVE_PENDING_POST,
            data: {id: 'post_id', channel_id: 'channel_id'},
            result: {
                currentFocusedPostId: '',
                messagesHistory: {},
                openGraph: {},
                reactions: {},
                selectedPostId: '',
                posts: {
                    other_post_id: {},
                },
                postsInChannel: {
                    channel_id: ['other_post_id'],
                    other_channel_id: ['post_id', 'other_post_id'],
                },
                postsInThread: {},
                pendingPostIds: ['other_post_id'],
                sendingPostIds: [],
                postsInChannelBackup: {},
            },
        };

        state = postsReducer(state, testAction);
        assert.deepEqual(state, testAction.result);
    });

    it('RECEIVED_CHANNEL_DELETED and DELETE_CHANNEL_SUCCESS on posts with viewArchivedChannels false', async () => {
        const posts = {
            post_id: {channel_id: 'channel_id'},
            other_post_id: {channel_id: 'other_channel_id'},
            other_post_more_id: {channel_id: 'other_channel_more_id'},
        };
        const postsInChannel = {
            channel_id: ['post_id', 'post_id2'],
            other_channel_id: ['other_post_id', 'other_post_id2'],
            other_channel_more_id: ['other_post_more_id', 'other_post_more_id2'],
        };
        const postsInThread = {
            post_id: ['other_post_id', 'other_post_more_id'],
            other_post_id: ['post_id', 'other_post_more_id'],
        };

        let state = {posts, postsInChannel, postsInThread};
        const testAction = {
            type: ChannelTypes.RECEIVED_CHANNEL_DELETED,
            data: {id: 'channel_id', viewArchivedChannels: false},
            result: {
                currentFocusedPostId: '',
                messagesHistory: {},
                openGraph: {},
                reactions: {},
                selectedPostId: '',
                posts: {
                    other_post_id: {channel_id: 'other_channel_id'},
                    other_post_more_id: {channel_id: 'other_channel_more_id'},
                },
                postsInChannel: {
                    other_channel_id: ['other_post_id', 'other_post_id2'],
                    other_channel_more_id: ['other_post_more_id', 'other_post_more_id2'],
                },
                postsInChannelBackup: {},
                postsInThread: {
                    other_post_id: ['other_post_more_id'],
                },
                pendingPostIds: [],
                sendingPostIds: [],
            },
        };

        state = postsReducer(state, testAction);
        assert.deepEqual(state, testAction.result);
    });

    it('RECEIVED_CHANNEL_DELETED and DELETE_CHANNEL_SUCCESS on posts with viewArchivedChannels true', async () => {
        const posts = {
            post_id: {channel_id: 'channel_id'},
            other_post_id: {channel_id: 'other_channel_id'},
            other_post_more_id: {channel_id: 'other_channel_more_id'},
        };
        const postsInChannel = {
            channel_id: ['post_id', 'post_id2'],
            other_channel_id: ['other_post_id', 'other_post_id2'],
            other_channel_more_id: ['other_post_more_id', 'other_post_more_id2'],
        };
        const postsInThread = {
            post_id: ['other_post_id', 'other_post_more_id'],
            other_post_id: ['post_id', 'other_post_more_id'],
        };

        let state = {posts, postsInChannel, postsInThread};

        const testAction = {
            type: ChannelTypes.RECEIVED_CHANNEL_DELETED,
            data: {id: 'channel_id', viewArchivedChannels: true},
            result: {
                currentFocusedPostId: '',
                messagesHistory: {},
                openGraph: {},
                reactions: {},
                selectedPostId: '',
                posts,
                postsInChannel,
                postsInChannelBackup: {},
                postsInThread,
                pendingPostIds: [],
                sendingPostIds: [],
            },
        };
        state = postsReducer(state, testAction);
        assert.deepEqual(state, testAction.result);
    });

    describe('sendingPostIds', () => {
        it('should remain unchanged for an UNKNOWN action', () => {
            const state = ['other_post'];
            const action = {
                type: 'UNKNOWN',
            };
            const expectedState = state;

            const actualState = postsReducer({sendingPostIds: state}, action);
            assert.strictEqual(actualState.sendingPostIds, expectedState);
        });

        it('should add a new post id on RECEIVED_NEW_POST', () => {
            const state = ['other_post'];
            const action = {
                type: PostTypes.RECEIVED_NEW_POST,
                data: {
                    id: 'post_id',
                    channel_id: 'channel_id',
                    pending_post_id: 'post_id',
                },
            };
            const expectedState = ['other_post', 'post_id'];

            const actualState = postsReducer({sendingPostIds: state}, action);
            assert.deepEqual(expectedState, actualState.sendingPostIds);
        });

        it('should remain unchanged if given an existing post id on RECEIVED_NEW_POST', () => {
            const state = ['other_post', 'post_id'];
            const action = {
                type: PostTypes.RECEIVED_NEW_POST,
                data: {
                    id: 'post_id',
                    channel_id: 'channel_id',
                    pending_post_id: 'post_id',
                },
            };
            const expectedState = state;

            const actualState = postsReducer({sendingPostIds: state}, action);
            assert.strictEqual(actualState.sendingPostIds, expectedState);
        });

        it('should remain remove a post on RECEIVED_POST', () => {
            const state = ['other_post', 'post_id'];
            const action = {
                type: PostTypes.RECEIVED_POST,
                data: {
                    id: 'post_id',
                },
            };
            const expectedState = ['other_post'];

            const actualState = postsReducer({sendingPostIds: state}, action);
            assert.deepEqual(actualState.sendingPostIds, expectedState);
        });

        it('should remain unchanged if given a non-existing post on RECEIVED_POST', () => {
            const state = ['other_post'];
            const action = {
                type: PostTypes.RECEIVED_POST,
                data: {
                    id: 'post_id',
                },
            };
            const expectedState = state;

            const actualState = postsReducer({sendingPostIds: state}, action);
            assert.strictEqual(actualState.sendingPostIds, expectedState);
        });

        it('should remain remove a post on RECEIVED_POSTS', () => {
            const state = ['other_post', 'post_id'];
            const action = {
                type: PostTypes.RECEIVED_POSTS,
                data: {
                    posts: {
                        actual_post_id: {
                            id: 'actual_post_id',
                            pending_post_id: 'post_id',
                        },
                        different_actual_post_id: {
                            id: 'different_actual_post_id',
                            pending_post_id: 'different_post_id',
                        },
                    },
                },
            };
            const expectedState = ['other_post'];

            const actualState = postsReducer({sendingPostIds: state}, action);
            assert.deepEqual(actualState.sendingPostIds, expectedState);
        });

        it('should remain unchanged if given a non-existing post on RECEIVED_POSTS', () => {
            const state = ['other_post'];
            const action = {
                type: PostTypes.RECEIVED_POSTS,
                data: {
                    posts: {
                        actual_post_id: {
                            id: 'actual_post_id',
                            pending_post_id: 'post_id',
                        },
                        different_actual_post_id: {
                            id: 'different_actual_post_id',
                            pending_post_id: 'different_post_id',
                        },
                    },
                },
            };
            const expectedState = state;

            const actualState = postsReducer({sendingPostIds: state}, action);
            assert.strictEqual(actualState.sendingPostIds, expectedState);
        });
    });

    describe('removeUnneededMetadata', () => {
        it('without metadata', () => {
            const post = deepFreeze({
                id: 'post',
            });

            const nextPost = removeUnneededMetadata(post);

            assert.equal(nextPost, post);
        });

        it('with empty metadata', () => {
            const post = deepFreeze({
                id: 'post',
                metadata: {},
            });

            const nextPost = removeUnneededMetadata(post);

            assert.equal(nextPost, post);
        });

        it('should remove emojis', () => {
            const post = deepFreeze({
                id: 'post',
                metadata: {
                    emojis: [{name: 'emoji'}],
                },
            });

            const nextPost = removeUnneededMetadata(post);

            assert.notEqual(nextPost, post);
            assert.deepEqual(nextPost, {
                id: 'post',
                metadata: {},
            });
        });

        it('should remove files', () => {
            const post = deepFreeze({
                id: 'post',
                metadata: {
                    files: [{id: 'file', post_id: 'post'}],
                },
            });

            const nextPost = removeUnneededMetadata(post);

            assert.notEqual(nextPost, post);
            assert.deepEqual(nextPost, {
                id: 'post',
                metadata: {},
            });
        });

        it('should remove reactions', () => {
            const post = deepFreeze({
                id: 'post',
                metadata: {
                    reactions: [
                        {user_id: 'abcd', emoji_name: '+1'},
                        {user_id: 'efgh', emoji_name: '+1'},
                        {user_id: 'abcd', emoji_name: '-1'},
                    ],
                },
            });

            const nextPost = removeUnneededMetadata(post);

            assert.notEqual(nextPost, post);
            assert.deepEqual(nextPost, {
                id: 'post',
                metadata: {},
            });
        });

        it('should remove OpenGraph data', () => {
            const post = deepFreeze({
                id: 'post',
                metadata: {
                    embeds: [{
                        type: 'opengraph',
                        url: 'https://example.com',
                        data: {
                            url: 'https://example.com',
                            images: [{
                                url: 'https://example.com/logo.png',
                                width: 100,
                                height: 100,
                            }],
                        },
                    }],
                },
            });

            const nextPost = removeUnneededMetadata(post);

            assert.notEqual(nextPost, post);
            assert.deepEqual(nextPost, {
                id: 'post',
                metadata: {
                    embeds: [{
                        type: 'opengraph',
                        url: 'https://example.com',
                    }],
                },
            });
        });

        it('should not affect non-OpenGraph embeds', () => {
            const post = deepFreeze({
                id: 'post',
                metadata: {
                    embeds: [
                        {type: 'image', url: 'https://example.com/image'},
                        {type: 'message_attachment'},
                    ],
                },
                props: {
                    attachments: [
                        {text: 'This is an attachment'},
                    ],
                },
            });

            const nextPost = removeUnneededMetadata(post);

            assert.equal(nextPost, post);
        });
    });

    describe('reactions', () => {
        const testForSinglePost = (actionType) => () => {
            it('no post metadata', () => {
                const state = deepFreeze({});
                const action = {
                    type: actionType,
                    data: {
                        id: 'post',
                    },
                };

                const nextState = reactionsReducer(state, action);

                assert.equal(nextState, state);
            });

            it('no reactions in post metadata', () => {
                const state = deepFreeze({});
                const action = {
                    type: actionType,
                    data: {
                        id: 'post',
                        metadata: {},
                    },
                };

                const nextState = reactionsReducer(state, action);

                assert.notEqual(nextState, state);
                assert.deepEqual(nextState, {
                    post: {},
                });
            });

            it('should save reactions', () => {
                const state = deepFreeze({});
                const action = {
                    type: actionType,
                    data: {
                        id: 'post',
                        metadata: {
                            reactions: [
                                {user_id: 'abcd', emoji_name: '+1'},
                                {user_id: 'efgh', emoji_name: '+1'},
                                {user_id: 'abcd', emoji_name: '-1'},
                            ],
                        },
                    },
                };

                const nextState = reactionsReducer(state, action);

                assert.notEqual(nextState, state);
                assert.deepEqual(nextState, {
                    post: {
                        'abcd-+1': {user_id: 'abcd', emoji_name: '+1'},
                        'efgh-+1': {user_id: 'efgh', emoji_name: '+1'},
                        'abcd--1': {user_id: 'abcd', emoji_name: '-1'},
                    },
                });
            });
        };

        describe('RECEIVED_NEW_POST', testForSinglePost(PostTypes.RECEIVED_NEW_POST));
        describe('RECEIVED_POST', testForSinglePost(PostTypes.RECEIVED_POST));

        describe('RECEIVED_POSTS', () => {
            it('no post metadata', () => {
                const state = deepFreeze({});
                const action = {
                    type: PostTypes.RECEIVED_POSTS,
                    data: {
                        posts: {
                            post: {
                                id: 'post',
                            },
                        },
                    },
                };

                const nextState = reactionsReducer(state, action);

                assert.equal(nextState, state);
            });

            it('no reactions in post metadata', () => {
                const state = deepFreeze({});
                const action = {
                    type: PostTypes.RECEIVED_POSTS,
                    data: {
                        posts: {
                            post: {
                                id: 'post',
                                metadata: {},
                            },
                        },
                    },
                };

                const nextState = reactionsReducer(state, action);

                assert.notEqual(nextState, state);
                assert.deepEqual(nextState, {
                    post: {},
                });
            });

            it('should save reactions', () => {
                const state = deepFreeze({});
                const action = {
                    type: PostTypes.RECEIVED_POSTS,
                    data: {
                        posts: {
                            post: {
                                id: 'post',
                                metadata: {
                                    reactions: [
                                        {user_id: 'abcd', emoji_name: '+1'},
                                        {user_id: 'efgh', emoji_name: '+1'},
                                        {user_id: 'abcd', emoji_name: '-1'},
                                    ],
                                },
                            },
                        },
                    },
                };

                const nextState = reactionsReducer(state, action);

                assert.notEqual(nextState, state);
                assert.deepEqual(nextState, {
                    post: {
                        'abcd-+1': {user_id: 'abcd', emoji_name: '+1'},
                        'efgh-+1': {user_id: 'efgh', emoji_name: '+1'},
                        'abcd--1': {user_id: 'abcd', emoji_name: '-1'},
                    },
                });
            });

            it('should save reactions for multiple posts', () => {
                const state = deepFreeze({});
                const action = {
                    type: PostTypes.RECEIVED_POSTS,
                    data: {
                        posts: {
                            post1: {
                                id: 'post1',
                                metadata: {
                                    reactions: [
                                        {user_id: 'abcd', emoji_name: '+1'},
                                    ],
                                },
                            },
                            post2: {
                                id: 'post2',
                                metadata: {
                                    reactions: [
                                        {user_id: 'abcd', emoji_name: '-1'},
                                    ],
                                },
                            },
                        },
                    },
                };

                const nextState = reactionsReducer(state, action);

                assert.notEqual(nextState, state);
                assert.deepEqual(nextState, {
                    post1: {
                        'abcd-+1': {user_id: 'abcd', emoji_name: '+1'},
                    },
                    post2: {
                        'abcd--1': {user_id: 'abcd', emoji_name: '-1'},
                    },
                });
            });
        });
    });

    describe('opengraph', () => {
        const testForSinglePost = (actionType) => () => {
            it('no post metadata', () => {
                const state = deepFreeze({});
                const action = {
                    type: actionType,
                    data: {
                        id: 'post',
                    },
                };

                const nextState = openGraphReducer(state, action);

                assert.equal(nextState, state);
            });

            it('no embeds in post metadata', () => {
                const state = deepFreeze({});
                const action = {
                    type: actionType,
                    data: {
                        id: 'post',
                        metadata: {},
                    },
                };

                const nextState = openGraphReducer(state, action);

                assert.equal(nextState, state);
            });

            it('other types of embeds in post metadata', () => {
                const state = deepFreeze({});
                const action = {
                    type: actionType,
                    data: {
                        id: 'post',
                        metadata: {
                            embeds: [{
                                type: 'image',
                                url: 'https://example.com/image.png',
                            }, {
                                type: 'message_attachment',
                            }],
                        },
                    },
                };

                const nextState = openGraphReducer(state, action);

                assert.equal(nextState, state);
            });

            it('should save opengraph data', () => {
                const state = deepFreeze({});
                const action = {
                    type: actionType,
                    data: {
                        id: 'post',
                        metadata: {
                            embeds: [{
                                type: 'opengraph',
                                url: 'https://example.com',
                                data: {
                                    title: 'Example',
                                    description: 'Example description',
                                },
                            }],
                        },
                    },
                };

                const nextState = openGraphReducer(state, action);

                assert.notEqual(nextState, state);
                assert.deepEqual(nextState, {
                    'https://example.com': action.data.metadata.embeds[0].data,
                });
            });
        };

        describe('RECEIVED_NEW_POST', testForSinglePost(PostTypes.RECEIVED_NEW_POST));
        describe('RECEIVED_POST', testForSinglePost(PostTypes.RECEIVED_POST));

        describe('RECEIVED_POSTS', () => {
            it('no post metadata', () => {
                const state = deepFreeze({});
                const action = {
                    type: PostTypes.RECEIVED_POSTS,
                    data: {
                        posts: {
                            post: {
                                id: 'post',
                            },
                        },
                    },
                };

                const nextState = openGraphReducer(state, action);

                assert.equal(nextState, state);
            });

            it('no embeds in post metadata', () => {
                const state = deepFreeze({});
                const action = {
                    type: PostTypes.RECEIVED_POSTS,
                    data: {
                        posts: {
                            post: {
                                id: 'post',
                                metadata: {},
                            },
                        },
                    },
                };

                const nextState = openGraphReducer(state, action);

                assert.equal(nextState, state);
            });

            it('other types of embeds in post metadata', () => {
                const state = deepFreeze({});
                const action = {
                    type: PostTypes.RECEIVED_POSTS,
                    data: {
                        posts: {
                            post: {
                                id: 'post',
                                metadata: {
                                    embeds: [{
                                        type: 'image',
                                        url: 'https://example.com/image.png',
                                    }, {
                                        type: 'message_attachment',
                                    }],
                                },
                            },
                        },
                    },
                };

                const nextState = openGraphReducer(state, action);

                assert.equal(nextState, state);
            });

            it('should save opengraph data', () => {
                const state = deepFreeze({});
                const action = {
                    type: PostTypes.RECEIVED_POSTS,
                    data: {
                        posts: {
                            post1: {
                                id: 'post1',
                                metadata: {
                                    embeds: [{
                                        type: 'opengraph',
                                        url: 'https://example.com',
                                        data: {
                                            title: 'Example',
                                            description: 'Example description',
                                        },
                                    }],
                                },
                            },
                        },
                    },
                };

                const nextState = openGraphReducer(state, action);

                assert.notEqual(nextState, state);
                assert.deepEqual(nextState, {
                    'https://example.com': action.data.posts.post1.metadata.embeds[0].data,
                });
            });

            it('should save reactions for multiple posts', () => {
                const state = deepFreeze({});
                const action = {
                    type: PostTypes.RECEIVED_POSTS,
                    data: {
                        posts: {
                            post1: {
                                id: 'post1',
                                metadata: {
                                    embeds: [{
                                        type: 'opengraph',
                                        url: 'https://example.com',
                                        data: {
                                            title: 'Example',
                                            description: 'Example description',
                                        },
                                    }],
                                },
                            },
                            post2: {
                                id: 'post2',
                                metadata: {
                                    embeds: [{
                                        type: 'opengraph',
                                        url: 'https://google.ca',
                                        data: {
                                            title: 'Google',
                                            description: 'Something about search',
                                        },
                                    }],
                                },
                            },
                        },
                    },
                };

                const nextState = openGraphReducer(state, action);

                assert.notEqual(nextState, state);
                assert.deepEqual(nextState, {
                    'https://example.com': action.data.posts.post1.metadata.embeds[0].data,
                    'https://google.ca': action.data.posts.post2.metadata.embeds[0].data,
                });
            });
        });
    });
});
