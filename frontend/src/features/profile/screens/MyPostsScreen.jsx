import React, {useCallback, useState} from 'react'
import {Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialIcons'
import {useFocusEffect} from '@react-navigation/native'
import {useAuth} from '../../../context/AuthContext'
import {deletePost, getMyPosts, updatePost} from '../../posts/services/postService'

const MyPostsScreen = ({navigation}) => {
    const {token} = useAuth()
    const [posts, setPosts] = useState([])
    const [editing, setEditing] = useState(null)

    const loadPosts = useCallback(async () => {
        try {
            const data = await getMyPosts(token)
            setPosts(data.posts || [])
        } catch (error) {
            Alert.alert('Unable to load posts', error.message)
        }
    }, [token])

    useFocusEffect(React.useCallback(() => {
        loadPosts()
    }, [loadPosts]))

    const save = async () => {
        if (!editing.title.trim() || !editing.description.trim()) return Alert.alert('Complete your post', 'Title and content are required.')
        try {
            const data = await updatePost(token, editing.id, {title: editing.title.trim(), description: editing.description.trim()})
            setPosts(current => current.map(post => post._id === editing.id ? data.post : post))
            setEditing(null)
        } catch (error) {
            Alert.alert('Unable to update post', error.message)
        }
    }

    const remove = postId => Alert.alert('Delete post?', 'This cannot be undone.', [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Delete', style: 'destructive', onPress: async () => {
            try {
                await deletePost(token, postId)
                setPosts(current => current.filter(post => post._id !== postId))
            } catch (error) {
                Alert.alert('Unable to delete post', error.message)
            }
        }}
    ])

    return <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <Pressable onPress={() => navigation.goBack()} hitSlop={10}><Icon name="arrow-back" size={23} color="#1D2B20" /></Pressable>
            <Text style={styles.headerTitle}>My Posts</Text>
            <View style={styles.headerSpacer} />
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {posts.length === 0 ? <View style={styles.empty}><Icon name="article" size={42} color="#9AAF9B" /><Text style={styles.emptyTitle}>No posts yet</Text><Text style={styles.emptyText}>Your posts will appear here.</Text></View> : posts.map(post => {
                const isEditing = editing?.id === post._id
                return <View key={post._id} style={styles.postCard}>
                    <View style={styles.postTop}><Text style={styles.postDate}>{new Date(post.createdAt).toLocaleDateString()}</Text><View style={styles.actions}><Pressable onPress={() => setEditing({id: post._id, title: post.title || '', description: post.description || post.content || ''})} hitSlop={8}><Icon name="edit" size={20} color="#438F51" /></Pressable><Pressable onPress={() => remove(post._id)} hitSlop={8}><Icon name="delete-outline" size={21} color="#B64C4C" /></Pressable></View></View>
                    {isEditing ? <><TextInput value={editing.title} onChangeText={title => setEditing({...editing, title})} style={styles.titleInput} placeholder="Post title" /><TextInput value={editing.description} onChangeText={description => setEditing({...editing, description})} style={styles.bodyInput} multiline textAlignVertical="top" placeholder="Write your post..." /><View style={styles.editActions}><Pressable onPress={() => setEditing(null)}><Text style={styles.cancel}>Cancel</Text></Pressable><Pressable onPress={save}><Text style={styles.save}>Save changes</Text></Pressable></View></> : <><Text style={styles.postTitle}>{post.title || 'Untitled post'}</Text><Text style={styles.postBody}>{post.description || post.content}</Text>{post.imageUrl ? <Image source={{uri: post.imageUrl}} style={styles.postImage} /> : null}</>}
                </View>
            })}
        </ScrollView>
    </SafeAreaView>
}

const styles = StyleSheet.create({
    safeArea: {flex: 1, backgroundColor: '#F4F7EF'}, header: {height: 58, paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center'}, headerTitle: {flex: 1, marginLeft: 14, fontSize: 19, fontWeight: '700', color: '#17231A'}, headerSpacer: {width: 23}, content: {padding: 15, paddingBottom: 30}, postCard: {backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0E8DC', borderRadius: 13, padding: 14, marginBottom: 12}, postTop: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}, postDate: {fontSize: 11, color: '#7A847B'}, actions: {flexDirection: 'row', gap: 18}, postTitle: {marginTop: 12, fontSize: 17, fontWeight: '700', color: '#243024'}, postBody: {marginTop: 8, fontSize: 14, lineHeight: 21, color: '#3F4941'}, postImage: {width: '100%', height: 190, borderRadius: 9, marginTop: 12}, titleInput: {marginTop: 12, borderWidth: 1, borderColor: '#C8D8C3', borderRadius: 8, padding: 10, color: '#243024', fontWeight: '700'}, bodyInput: {height: 120, marginTop: 9, borderWidth: 1, borderColor: '#C8D8C3', borderRadius: 8, padding: 10, color: '#243024'}, editActions: {flexDirection: 'row', justifyContent: 'flex-end', gap: 18, marginTop: 12}, cancel: {color: '#687068'}, save: {color: '#438F51', fontWeight: '700'}, empty: {alignItems: 'center', paddingTop: 80}, emptyTitle: {marginTop: 12, fontWeight: '700', color: '#344437'}, emptyText: {marginTop: 5, color: '#687068'}
})

export default MyPostsScreen
