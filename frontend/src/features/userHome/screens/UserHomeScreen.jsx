import React, {useCallback, useState} from 'react'
import {Alert, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialIcons'
import {useFocusEffect} from '@react-navigation/native'
import {useAuth} from '../../../context/AuthContext'
import {addComment, deleteComment, getFeedPosts, updateComment} from '../../posts/services/postService'

const UserHomeScreen = ({navigation}) => {
    const {token, user} = useAuth()
    const [posts, setPosts] = useState([])
    const [commentText, setCommentText] = useState({})
    const [editingComment, setEditingComment] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    const loadPosts = useCallback(async () => {
        try {
            setIsLoading(true)
            const data = await getFeedPosts(token)
            setPosts(data.posts || [])
        } catch (error) {
            Alert.alert('Unable to load feed', error.message)
        } finally {
            setIsLoading(false)
        }
    }, [token])

    useFocusEffect(React.useCallback(() => {
        loadPosts()
    }, [loadPosts]))

    const replacePost = post => {
        setPosts(current => current.map(item => item._id === post._id ? post : item))
    }

    const submitComment = async postId => {
        const content = commentText[postId]?.trim()
        if (!content) return

        try {
            const data = await addComment(token, postId, content)
            replacePost(data.post)
            setCommentText(current => ({...current, [postId]: ''}))
        } catch (error) {
            Alert.alert('Unable to add comment', error.message)
        }
    }

    const saveComment = async (postId, commentId, content) => {
        try {
            const data = await updateComment(token, postId, commentId, content)
            replacePost(data.post)
            setEditingComment(null)
        } catch (error) {
            Alert.alert('Unable to update comment', error.message)
        }
    }

    const removeComment = async (postId, commentId) => {
        try {
            const data = await deleteComment(token, postId, commentId)
            replacePost(data.post)
        } catch (error) {
            Alert.alert('Unable to delete comment', error.message)
        }
    }

    const renderPost = ({item: post}) => {
        return (
            <View style={styles.postCard}>
                <View style={styles.postHeader}>
                    <View style={styles.authorInfo}>
                        <View style={styles.authorAvatar}>
                            {post.author?.profilePicture ? <Image source={{uri: post.author.profilePicture}} style={styles.authorImage} /> : <Text style={styles.authorInitial}>{post.author?.name?.charAt(0)?.toUpperCase() || 'M'}</Text>}
                        </View>
                        <View>
                            <Text style={styles.author}>{post.author?.name || 'MindMatter user'}</Text>
                            <Text style={styles.date}>{new Date(post.createdAt).toLocaleDateString()}</Text>
                        </View>
                    </View>
                    <Icon name="more-horiz" size={23} color="#243024" />
                </View>
                <Text style={styles.content}>{post.description || post.content}</Text>
                {post.imageUrl ? <Image source={{uri: post.imageUrl}} style={styles.postImage} /> : null}

                <View style={styles.engagementRow}>
                    <Icon name="favorite-border" size={21} color="#4E8C4A" />
                    <Text style={styles.engagementText}>{post.likes?.length || 0}</Text>
                    <Icon name="chat-bubble-outline" size={20} color="#536057" />
                    <Text style={styles.engagementText}>{post.comments?.length || 0}</Text>
                    <Icon name="share" size={20} color="#536057" />
                    <Text style={styles.shareText}>Share</Text>
                    <Icon name="bookmark-border" size={21} color="#536057" />
                </View>

                <Text style={styles.commentHeading}>Comments ({post.comments?.length || 0})</Text>
                {(post.comments || []).map(comment => {
                    const commentIsBeingEdited = editingComment?.id === comment._id
                    const commentIsOwned = comment.user?._id === user?._id
                    return (
                        <View key={comment._id} style={styles.comment}>
                            <Text style={styles.commentAuthor}>{comment.user?.name || 'User'}</Text>
                            {commentIsBeingEdited ? (
                                <TextInput value={editingComment.content} onChangeText={content => setEditingComment({...editingComment, content})} style={styles.editInput} />
                            ) : <Text style={styles.commentContent}>{comment.content}</Text>}
                            {commentIsOwned && (
                                <View style={styles.inlineActions}>
                                    {commentIsBeingEdited ? (
                                        <TouchableOpacity onPress={() => saveComment(post._id, comment._id, editingComment.content)}><Text style={styles.actionText}>Save</Text></TouchableOpacity>
                                    ) : <TouchableOpacity onPress={() => setEditingComment({id: comment._id, content: comment.content})}><Text style={styles.actionText}>Edit</Text></TouchableOpacity>}
                                    <TouchableOpacity onPress={() => removeComment(post._id, comment._id)}><Text style={styles.deleteText}>Delete</Text></TouchableOpacity>
                                </View>
                            )}
                        </View>
                    )
                })}
                <View style={styles.commentComposer}>
                    <TextInput
                        value={commentText[post._id] || ''}
                        onChangeText={content => setCommentText(current => ({...current, [post._id]: content}))}
                        placeholder="Add a comment..."
                        placeholderTextColor="#8A918A"
                        style={styles.commentInput}
                    />
                    <TouchableOpacity onPress={() => submitComment(post._id)} style={styles.commentButton}>
                        <Icon name="send" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </View>
        )
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <FlatList
                data={posts}
                renderItem={renderPost}
                keyExtractor={post => post._id}
                refreshing={isLoading}
                onRefresh={loadPosts}
                contentContainerStyle={styles.list}
                ListHeaderComponent={<>
                    <View style={styles.brandHeader}><View style={styles.brandMark}><Icon name="spa" size={28} color="#4E8C4A" /></View><View><Text style={styles.brandName}>Mind<Text style={styles.brandGreen}>Matter</Text></Text><Text style={styles.brandTagline}>You matter. Your mind matters.</Text></View><Icon name="notifications-none" size={25} color="#17231A" /></View>
                    <TouchableOpacity style={styles.composer} onPress={() => navigation.navigate('Create')}><Icon name="spa" size={22} color="#243024" /><Text style={styles.composerText}>What's on your mind?</Text><Icon name="image" size={22} color="#243024" /></TouchableOpacity>
                    <View style={styles.feedTabs}><Text style={styles.activeTab}>For You</Text><Text style={styles.tab}>Following</Text><Text style={styles.tab}>Latest</Text></View>
                </>}
                ListEmptyComponent={!isLoading ? <Text style={styles.empty}>No posts yet. Share the first thought.</Text> : null}
            />
            <TouchableOpacity 
                style={styles.fab}
                onPress={() => navigation.navigate('ProfessionalHelp')}
                accessible={true}
                accessibilityLabel="Talk to a professional"
                accessibilityRole="button"
            >
                <View style={styles.fabContent}>
                    <View style={styles.fabIconContainer}>
                        <Icon name="volunteer-activism" size={24} color="#FFFFFF" />
                    </View>
                    <Text style={styles.fabLabel}>Professional help</Text>
                </View>
            </TouchableOpacity>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F4F7EF',
    },

    list: {
        paddingHorizontal: 10,
        paddingBottom: 110,
    },

    empty: {
        textAlign: 'center',
        marginTop: 30,
        color: '#687068',
    },

    postCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 12,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#E0E8DC',
    },

    postHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    brandHeader: {paddingHorizontal: 14, paddingTop: 10, paddingBottom: 20, flexDirection: 'row', alignItems: 'center'},
    brandMark: {width: 46, alignItems: 'center'},
    brandName: {fontSize: 23, color: '#17231A', fontWeight: '400'},
    brandGreen: {color: '#397A49'},
    brandTagline: {fontSize: 10, color: '#4F5A51', marginTop: 2},
    composer: {height: 60, marginHorizontal: 2, paddingHorizontal: 15, borderRadius: 13, borderWidth: 1, borderColor: '#E0E8DC', backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center'},
    composerText: {flex: 1, marginLeft: 14, color: '#69736B', fontSize: 14},
    feedTabs: {height: 58, borderBottomWidth: 1, borderBottomColor: '#E0E8DC', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center'},
    activeTab: {height: 58, paddingTop: 21, color: '#276D3B', fontWeight: '700', borderBottomWidth: 2, borderBottomColor: '#3F9651'},
    tab: {color: '#1B251D', fontSize: 13},
    authorInfo: {flexDirection: 'row', alignItems: 'center'},
    authorAvatar: {width: 40, height: 40, borderRadius: 20, backgroundColor: '#DDEBD8', alignItems: 'center', justifyContent: 'center', marginRight: 10, overflow: 'hidden'},
    authorImage: {width: '100%', height: '100%'},
    authorInitial: {fontSize: 17, fontWeight: '700', color: '#397A49'},

    author: {
        fontWeight: '700',
        color: '#243024',
        fontSize: 14,
    },

    date: {
        marginTop: 3,
        fontSize: 12,
        color: '#8A918A',
    },

    actions: {
        flexDirection: 'row',
        gap: 16,
    },

    content: {
        marginTop: 15,
        color: '#243024',
        fontSize: 14,
        lineHeight: 22,
    },

    postImage: {
        width: '100%',
        height: 210,
        marginTop: 10,
        borderRadius: 10,
    },

    engagementRow: {flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8},
    engagementText: {fontSize: 11, color: '#26342A', marginRight: 13},
    shareText: {fontSize: 11, color: '#26342A', marginRight: 'auto'},

    editTitleInput: {
        marginTop: 12,
        padding: 10,
        borderWidth: 1,
        borderColor: '#C8D8C3',
        borderRadius: 8,
        color: '#243024',
        fontWeight: '700',
    },

    editInput: {
        marginTop: 10,
        padding: 10,
        borderWidth: 1,
        borderColor: '#C8D8C3',
        borderRadius: 8,
        color: '#243024',
    },

    inlineActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 16,
        marginTop: 8,
    },

    actionText: {
        color: '#4E8C4A',
        fontWeight: '700',
    },

    cancel: {
        color: '#687068',
    },

    deleteText: {
        color: '#B64C4C',
    },

    commentHeading: {
        marginTop: 18,
        color: '#687068',
        fontSize: 13,
        fontWeight: '700',
    },

    comment: {
        marginTop: 10,
        paddingLeft: 10,
        borderLeftWidth: 2,
        borderLeftColor: '#D8E1D4',
    },

    commentAuthor: {
        color: '#243024',
        fontSize: 13,
        fontWeight: '700',
    },

    commentContent: {
        marginTop: 2,
        color: '#4D594D',
    },

    commentComposer: {
        flexDirection: 'row',
        marginTop: 16,
        alignItems: 'center',
    },

    commentInput: {
        flex: 1,
        minHeight: 42,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#D8E1D4',
        borderRadius: 8,
        color: '#243024',
    },

    commentButton: {
        marginLeft: 8,
        width: 42,
        height: 42,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4E8C4A',
    },

    fab: {
        position: 'absolute',
        bottom: 80,
        right: 24,
        alignItems: 'center',
    },

    fabContent: {
        alignItems: 'center',
    },

    fabIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#4E8C4A',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },

    fabLabel: {
        marginTop: 8,
        fontSize: 12,
        fontWeight: '600',
        color: '#4E8C4A',
    },
})

export default UserHomeScreen