<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Contact;
// use App\Models\ContactPhone;


class ContactController extends Controller
{
    public function index() { 
        return response()->json(Contact::with('phones')->get()); 
    }

    public function store(Request $request) {
        
        $request->validate([
            'nama'=>'required', 
            'alamat'=>'required', 
            'tanggal_lahir'=>'required|date', 
            'phones'=>'array'
        ]);
        $contact = Contact::create($request->only(
            'nama', 
            'alamat', 
            'tanggal_lahir'
        ));
        if ($request->has('phones')) $contact->phones()->createMany($request->phones);
        
        return response()->json($contact->load('phones'), 201);
    }   

    public function show($id) { 
        return response()->json(Contact::with('phones')->findOrFail($id)); 
    }

    public function destroy($id) { 
        Contact::destroy($id); return response()->json(['message'=>'Kontak Terhapus']); 
    }

}